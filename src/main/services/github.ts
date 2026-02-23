import { Octokit } from '@octokit/rest';
import { simpleGit } from 'simple-git';
import type { SettingsService } from './settings';
import type {
  PRData,
  PRState,
  ReviewState,
  ChecksState,
  IssueData,
} from '../../shared/types';

interface GitHubError extends Error {
  status?: number;
}

export class GitHubService {
  private octokit: Octokit | null = null;
  private settingsService: SettingsService;

  constructor(settingsService: SettingsService) {
    this.settingsService = settingsService;
  }

  initialize(): void {
    const token = this.settingsService.getGitHubToken();
    if (token) {
      this.octokit = new Octokit({ auth: token });
    } else {
      this.octokit = null;
    }
  }

  reinitialize(): void {
    this.initialize();
  }

  isConnected(): boolean {
    return this.octokit !== null;
  }

  async checkToken(): Promise<{
    valid: boolean;
    login: string | null;
    scopes: string[];
    expiresAt: string | null;
  }> {
    if (!this.octokit) {
      return { valid: false, login: null, scopes: [], expiresAt: null };
    }

    try {
      const response = await this.octokit.rest.users.getAuthenticated();
      const { data, headers } = response;

      // Extract scopes from x-oauth-scopes header
      const scopeHeader = headers['x-oauth-scopes'] ?? '';
      const scopes = scopeHeader
        ? scopeHeader.split(',').map((s: string) => s.trim()).filter(Boolean)
        : ['fine-grained'];

      // Extract expiration from x-github-authentication-token-expiration header
      const expirationHeader = headers['x-github-authentication-token-expiration'] as string | undefined;
      let expiresAt: string | null = null;
      if (expirationHeader) {
        const parsed = new Date(expirationHeader);
        if (!isNaN(parsed.getTime())) {
          expiresAt = parsed.toISOString();
        }
      }

      return { valid: true, login: data.login, scopes, expiresAt };
    } catch (error) {
      const status = (error as GitHubError).status;
      if (status === 401) {
        return { valid: false, login: null, scopes: [], expiresAt: null };
      }
      throw error;
    }
  }

  async getPRForBranch(
    owner: string,
    repo: string,
    branch: string
  ): Promise<PRData | null> {
    if (!this.octokit) return null;

    try {
      const { data: prs } = await this.octokit.rest.pulls.list({
        owner,
        repo,
        head: `${owner}:${branch}`,
        state: 'all',
        per_page: 1,
      });

      if (prs.length === 0) return null;

      const pr = prs[0];
      const [reviewState, checksState] = await Promise.all([
        this.getReviewState(owner, repo, pr.number),
        this.getChecksState(owner, repo, pr.head.ref),
      ]);

      return {
        number: pr.number,
        title: pr.title,
        state: this.mapPRState(pr.state, pr.draft ?? false, pr.merged_at),
        reviewState,
        checksState,
        commentCount: 0,
        htmlUrl: pr.html_url,
        headBranch: pr.head.ref,
      };
    } catch (error) {
      if ((error as GitHubError).status === 404) return null;
      throw error;
    }
  }

  async getPRByNumber(
    owner: string,
    repo: string,
    prNumber: number
  ): Promise<PRData | null> {
    if (!this.octokit) return null;

    try {
      const { data: pr } = await this.octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: prNumber,
      });

      const [reviewState, checksState] = await Promise.all([
        this.getReviewState(owner, repo, pr.number),
        this.getChecksState(owner, repo, pr.head.sha),
      ]);

      return {
        number: pr.number,
        title: pr.title,
        state: this.mapPRState(pr.state, pr.draft ?? false, pr.merged_at),
        reviewState,
        checksState,
        commentCount: pr.comments ?? 0,
        htmlUrl: pr.html_url,
        headBranch: pr.head.ref,
      };
    } catch (error) {
      if ((error as GitHubError).status === 404) return null;
      throw error;
    }
  }

  async getIssue(
    owner: string,
    repo: string,
    issueNumber: number
  ): Promise<IssueData | null> {
    if (!this.octokit) return null;

    try {
      const { data } = await this.octokit.rest.issues.get({
        owner,
        repo,
        issue_number: issueNumber,
      });

      return {
        number: data.number,
        title: data.title,
        state: data.state as 'open' | 'closed',
        htmlUrl: data.html_url,
      };
    } catch (error) {
      if ((error as GitHubError).status === 404) return null;
      throw error;
    }
  }

  async getRemoteInfo(
    repoPath: string
  ): Promise<{ owner: string; repo: string } | null> {
    try {
      const g = simpleGit(repoPath);
      const output = await g.remote(['--verbose']);
      if (!output) return null;

      // Find the origin fetch URL
      const lines = output.trim().split('\n');
      const originLine = lines.find(
        (line) => line.startsWith('origin') && line.includes('(fetch)')
      );
      if (!originLine) return null;

      const url = originLine.split('\t')[1]?.split(' ')[0];
      if (!url) return null;

      return this.parseGitHubUrl(url);
    } catch {
      return null;
    }
  }

  private parseGitHubUrl(
    url: string
  ): { owner: string; repo: string } | null {
    // HTTPS: https://github.com/owner/repo.git
    const httpsMatch = url.match(
      /github\.com\/([^/]+)\/([^/.]+)(?:\.git)?$/
    );
    if (httpsMatch) {
      return { owner: httpsMatch[1], repo: httpsMatch[2] };
    }

    // SSH: git@github.com:owner/repo.git
    const sshMatch = url.match(
      /github\.com:([^/]+)\/([^/.]+)(?:\.git)?$/
    );
    if (sshMatch) {
      return { owner: sshMatch[1], repo: sshMatch[2] };
    }

    return null;
  }

  private mapPRState(
    state: string,
    draft: boolean,
    mergedAt: string | null | undefined
  ): PRState {
    if (mergedAt) return 'merged';
    if (draft) return 'draft';
    if (state === 'closed') return 'closed';
    return 'open';
  }

  private async getReviewState(
    owner: string,
    repo: string,
    prNumber: number
  ): Promise<ReviewState | null> {
    if (!this.octokit) return null;

    try {
      const { data: reviews } = await this.octokit.rest.pulls.listReviews({
        owner,
        repo,
        pull_number: prNumber,
      });

      if (reviews.length === 0) return null;

      // Get the most recent decisive review
      const decisiveReviews = reviews.filter(
        (r) => r.state === 'APPROVED' || r.state === 'CHANGES_REQUESTED'
      );

      if (decisiveReviews.length === 0) return 'pending';

      const latest = decisiveReviews[decisiveReviews.length - 1];
      if (latest.state === 'APPROVED') return 'approved';
      if (latest.state === 'CHANGES_REQUESTED') return 'changes_requested';

      return 'pending';
    } catch {
      return null;
    }
  }

  private async getChecksState(
    owner: string,
    repo: string,
    ref: string
  ): Promise<ChecksState | null> {
    if (!this.octokit) return null;

    try {
      const { data } = await this.octokit.rest.checks.listForRef({
        owner,
        repo,
        ref,
      });

      const runs = data.check_runs;
      if (runs.length === 0) return null;

      const hasFailure = runs.some(
        (r) => r.conclusion === 'failure' || r.conclusion === 'timed_out'
      );
      if (hasFailure) return 'failure';

      const allComplete = runs.every(
        (r) => r.status === 'completed'
      );
      if (allComplete) return 'success';

      return 'pending';
    } catch {
      return null;
    }
  }
}
