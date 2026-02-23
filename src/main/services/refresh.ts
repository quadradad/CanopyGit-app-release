import type { GitService } from './git';
import type { DatabaseService } from './database';
import type { GitHubService } from './github';
import type {
  GitSyncStatus,
  BranchStatus,
  RefreshResult,
  BranchRefreshResult,
  PRCacheEntry,
} from '../../shared/types';
import { PR_CACHE_TTL_MS } from '../../shared/constants';

export class RefreshService {
  private gitService: GitService;
  private databaseService: DatabaseService;
  private githubService: GitHubService;

  constructor(
    gitService: GitService,
    databaseService: DatabaseService,
    githubService: GitHubService
  ) {
    this.gitService = gitService;
    this.databaseService = databaseService;
    this.githubService = githubService;
  }

  async refresh(repoPath: string, repoId: number): Promise<RefreshResult> {
    // ── Phase 1: Git (local, fast) ──
    const [branches, currentBranch] = await Promise.all([
      this.gitService.listBranches(repoPath),
      this.gitService.getCurrentBranch(repoPath),
    ]);

    const branchNames = branches.map((b) => b.name);

    // Get statuses in parallel
    const statusEntries = await Promise.all(
      branches.map(async (b) => {
        try {
          const status = await this.gitService.getStatus(repoPath, b.name);
          return [b.name, status] as [string, GitSyncStatus];
        } catch {
          return [
            b.name,
            { ahead: 0, behind: 0, hasUpstream: false, isDirty: false },
          ] as [string, GitSyncStatus];
        }
      })
    );
    const statuses: Record<string, GitSyncStatus> = Object.fromEntries(statusEntries);

    // Compute merge-bases against the default/root branch
    const rootBranch = branches.find((b) => b.name === 'main' || b.name === 'master');
    const rootName = rootBranch?.name ?? currentBranch;

    const mergeBaseEntries = await Promise.all(
      branches
        .filter((b) => b.name !== rootName)
        .map(async (b) => {
          try {
            const sha = await this.gitService.getMergeBase(
              repoPath,
              b.name,
              rootName
            );
            return [b.name, sha] as [string, string];
          } catch {
            return [b.name, ''] as [string, string];
          }
        })
    );
    const mergeBases: Record<string, string> = Object.fromEntries(mergeBaseEntries);

    // ── Phase 2: DB Reconciliation ──
    const existingRecords = this.databaseService.getAllBranches(repoId);
    const existingMap = new Map(
      existingRecords.map((r) => [r.branchName, r])
    );
    const gitBranchSet = new Set(branchNames);

    // Upsert all current branches and update last_seen
    for (const name of branchNames) {
      if (!existingMap.has(name)) {
        this.databaseService.upsertBranch(repoId, name, { status: 'active' });
      }
    }
    this.databaseService.updateBranchLastSeen(repoId, branchNames);

    // Soft-delete branches no longer in git
    for (const record of existingRecords) {
      if (!gitBranchSet.has(record.branchName) && !record.hidden) {
        this.databaseService.setBranchHidden(repoId, record.branchName, true);
      }
    }

    // Restore previously hidden branches that reappear
    for (const record of existingRecords) {
      if (gitBranchSet.has(record.branchName) && record.hidden) {
        this.databaseService.setBranchHidden(
          repoId,
          record.branchName,
          false
        );
      }
    }

    // Get final records
    const records = this.databaseService.getBranches(repoId);

    // ── Phase 3: GitHub (network, optional) ──
    const prCache: Record<string, PRCacheEntry> = {};

    // Always fetch remote info (reads local git config, no token needed)
    const remoteInfo = await this.githubService.getRemoteInfo(repoPath);

    // Auto-update repo display name to owner/repo format if currently basename-only
    if (remoteInfo) {
      const repos = this.databaseService.getRepos();
      const repo = repos.find((r) => r.id === repoId);
      if (repo && !repo.displayName.includes('/')) {
        this.databaseService.updateRepoDisplayName(
          repoId,
          `${remoteInfo.owner}/${remoteInfo.repo}`
        );
      }
    }

    if (this.githubService.isConnected() && remoteInfo) {
      await Promise.all(
        branchNames.map(async (name) => {
          const cached = this.databaseService.getCachedPR(repoId, name);

          if (cached && this.isCacheFresh(cached.fetchedAt)) {
            prCache[name] = cached;
            return;
          }

          try {
            const prData = await this.githubService.getPRForBranch(
              remoteInfo.owner,
              remoteInfo.repo,
              name
            );
            if (prData) {
              const entry: PRCacheEntry = {
                prNumber: prData.number,
                branchName: name,
                title: prData.title,
                state: prData.state,
                reviewState: prData.reviewState,
                checksState: prData.checksState,
                commentCount: prData.commentCount,
                htmlUrl: prData.htmlUrl,
                fetchedAt: new Date().toISOString(),
              };
              this.databaseService.upsertPRCache(repoId, entry);
              prCache[name] = entry;
            }
          } catch {
            // If GitHub fetch fails for a branch, use stale cache if available
            if (cached) {
              prCache[name] = cached;
            }
          }
        })
      );
    }

    // ── Phase 4: Auto-set status from PR state ──
    const ELIGIBLE_STATUSES: Set<BranchStatus> = new Set(['active', 'waiting_on_pr', 'ready_to_merge']);
    const recordMap = new Map(records.map((r) => [r.branchName, r]));

    for (const [branchName, cached] of Object.entries(prCache)) {
      const record = recordMap.get(branchName);
      if (!record || !ELIGIBLE_STATUSES.has(record.status)) continue;

      const derived = this.deriveStatusFromPR(cached);
      if (derived && derived !== record.status) {
        this.databaseService.upsertBranch(repoId, branchName, { status: derived });
      }
    }

    // Re-fetch records after potential status updates
    const finalRecords = this.databaseService.getBranches(repoId);

    return {
      branches,
      currentBranch,
      statuses,
      mergeBases,
      records: finalRecords,
      prCache,
      remoteInfo,
    };
  }

  async refreshBranch(
    repoPath: string,
    repoId: number,
    branchName: string
  ): Promise<BranchRefreshResult> {
    const branches = await this.gitService.listBranches(repoPath);
    const branch = branches.find((b) => b.name === branchName);
    if (!branch) {
      throw new Error(`Branch "${branchName}" not found in the repository.`);
    }

    const status = await this.gitService.getStatus(repoPath, branchName);

    const record = this.databaseService.getBranch(repoId, branchName);
    if (!record) {
      throw new Error(
        `No database record found for branch "${branchName}".`
      );
    }

    let pr: PRCacheEntry | null = null;
    if (this.githubService.isConnected()) {
      const remoteInfo = await this.githubService.getRemoteInfo(repoPath);
      if (remoteInfo) {
        const cached = this.databaseService.getCachedPR(repoId, branchName);
        if (cached && this.isCacheFresh(cached.fetchedAt)) {
          pr = cached;
        } else {
          try {
            const prData = await this.githubService.getPRForBranch(
              remoteInfo.owner,
              remoteInfo.repo,
              branchName
            );
            if (prData) {
              const entry: PRCacheEntry = {
                prNumber: prData.number,
                branchName,
                title: prData.title,
                state: prData.state,
                reviewState: prData.reviewState,
                checksState: prData.checksState,
                commentCount: prData.commentCount,
                htmlUrl: prData.htmlUrl,
                fetchedAt: new Date().toISOString(),
              };
              this.databaseService.upsertPRCache(repoId, entry);
              pr = entry;
            }
          } catch {
            pr = cached;
          }
        }
      }
    }

    return { branch, status, record, pr };
  }

  private deriveStatusFromPR(pr: PRCacheEntry): BranchStatus | null {
    if (pr.state === 'draft') return 'active';
    if (pr.state === 'merged') return 'ready_to_merge';
    if (pr.state === 'closed') return null; // closed without merge — no change
    // state === 'open'
    if (pr.reviewState === 'approved') return 'ready_to_merge';
    return 'waiting_on_pr';
  }

  private isCacheFresh(fetchedAt: string): boolean {
    const fetchedTime = new Date(fetchedAt).getTime();
    return Date.now() - fetchedTime < PR_CACHE_TTL_MS;
  }
}
