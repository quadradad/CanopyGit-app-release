import { simpleGit } from 'simple-git';
import type { GitBranch, GitSyncStatus, GitCommit } from '../../shared/types';

export class GitService {
  private git(repoPath: string) {
    return simpleGit(repoPath);
  }

  async listBranches(repoPath: string): Promise<GitBranch[]> {
    const g = this.git(repoPath);

    // Get current branch
    const currentBranch = await g.revparse(['--abbrev-ref', 'HEAD']);

    // Get branch info with tracking
    const branchSummary = await g.branch();

    // Get detailed branch metadata via for-each-ref
    const refOutput = await g.raw([
      'for-each-ref',
      '--format=%(refname:short)|%(objectname:short)|%(committerdate:iso)',
      'refs/heads/',
    ]);

    const refMap = new Map<string, { sha: string; date: string }>();
    for (const line of refOutput.trim().split('\n')) {
      if (!line) continue;
      const [name, sha, date] = line.split('|');
      refMap.set(name, { sha, date });
    }

    // Filter to local branches only — remote refs duplicate local branches
    // and lack for-each-ref metadata (only refs/heads/ is queried)
    const localBranches = branchSummary.all.filter(name => !name.startsWith('remotes/'));

    const branches: GitBranch[] = [];
    for (const branchName of localBranches) {
      const ref = refMap.get(branchName);
      const branchInfo = branchSummary.branches[branchName];

      // Determine upstream tracking
      let hasUpstream = false;
      let upstreamName: string | null = null;
      try {
        const tracking = await g.raw([
          'config',
          '--get',
          `branch.${branchName}.remote`,
        ]);
        if (tracking.trim()) {
          hasUpstream = true;
          upstreamName = `${tracking.trim()}/${branchName}`;
        }
      } catch {
        // No upstream configured
      }

      branches.push({
        name: branchName,
        isCurrent: branchInfo?.current || branchName === currentBranch.trim(),
        hasUpstream,
        upstreamName,
        lastCommitDate: ref?.date ?? '',
        lastCommitSha: ref?.sha ?? '',
      });
    }

    return branches;
  }

  async getCurrentBranch(repoPath: string): Promise<string> {
    const g = this.git(repoPath);
    const result = await g.revparse(['--abbrev-ref', 'HEAD']);
    return result.trim();
  }

  async getStatus(
    repoPath: string,
    branch: string
  ): Promise<GitSyncStatus> {
    const g = this.git(repoPath);
    const statusResult = await g.status();

    const isDirty = !statusResult.isClean();
    const hasUpstream = !!statusResult.tracking;

    let ahead = 0;
    let behind = 0;

    if (hasUpstream) {
      try {
        const countOutput = await g.raw([
          'rev-list',
          '--left-right',
          '--count',
          `${branch}...${statusResult.tracking}`,
        ]);
        const [aheadStr, behindStr] = countOutput.trim().split('\t');
        ahead = parseInt(aheadStr, 10) || 0;
        behind = parseInt(behindStr, 10) || 0;
      } catch {
        // If rev-list fails, keep ahead/behind at 0
      }
    }

    return { ahead, behind, hasUpstream, isDirty };
  }

  async getLog(
    repoPath: string,
    branch: string,
    parentBranch: string,
    limit: number
  ): Promise<GitCommit[]> {
    const g = this.git(repoPath);
    const output = await g.raw([
      'log',
      `${parentBranch}..${branch}`,
      `--max-count=${limit}`,
      '--format=%H|%s|%an|%aI',
    ]);

    if (!output.trim()) return [];

    return output
      .trim()
      .split('\n')
      .filter((line) => line.includes('|'))
      .map((line) => {
        const [sha, message, author, date] = line.split('|');
        return { sha, message, author, date };
      });
  }

  async getMergeBase(
    repoPath: string,
    branchA: string,
    branchB: string
  ): Promise<string> {
    const g = this.git(repoPath);
    try {
      const result = await g.raw(['merge-base', branchA, branchB]);
      return result.trim();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      if (message.includes('no merge base') || message.includes('Not a valid')) {
        throw new Error(
          `No common ancestor found between '${branchA}' and '${branchB}'.`
        );
      }
      throw error;
    }
  }

  async validateRepo(
    folderPath: string
  ): Promise<{ isRepo: boolean; defaultBranch: string | null }> {
    const g = this.git(folderPath);
    try {
      await g.raw(['rev-parse', '--is-inside-work-tree']);
    } catch {
      return { isRepo: false, defaultBranch: null };
    }

    // Detect default branch
    try {
      const mainCheck = await g.raw(['branch', '--list', 'main']);
      if (mainCheck.trim()) return { isRepo: true, defaultBranch: 'main' };
    } catch {
      // continue to fallback
    }

    try {
      const masterCheck = await g.raw(['branch', '--list', 'master']);
      if (masterCheck.trim()) return { isRepo: true, defaultBranch: 'master' };
    } catch {
      // continue to fallback
    }

    try {
      const allBranches = await g.raw(['branch', '--list']);
      const first = allBranches
        .trim()
        .split('\n')
        .map((b) => b.replace(/^\*?\s+/, '').trim())
        .filter(Boolean)[0];
      return { isRepo: true, defaultBranch: first ?? null };
    } catch {
      return { isRepo: true, defaultBranch: null };
    }
  }

  async deleteBranch(repoPath: string, branch: string): Promise<void> {
    const g = this.git(repoPath);
    try {
      await g.branch(['-d', branch]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      if (message.includes('not fully merged')) {
        throw new Error(
          `This branch has unmerged changes. Delete it in the terminal with \`git branch -D\` if you're sure.`
        );
      }
      if (message.includes('No such ref') || message.includes('not found')) {
        throw new Error('Branch not found. It may have been deleted.');
      }
      throw error;
    }
  }
}
