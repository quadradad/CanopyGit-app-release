// ── Enums ──

export type BranchStatus =
  | 'active'
  | 'waiting_on_pr'
  | 'waiting_on_person'
  | 'blocked_by_issue'
  | 'ready_to_merge'
  | 'stale'
  | 'abandoned';

export type BlockerType = 'pr' | 'person' | 'issue';

export type PRState = 'open' | 'closed' | 'merged' | 'draft';

export type ReviewState = 'pending' | 'changes_requested' | 'approved';

export type ChecksState = 'pending' | 'success' | 'failure';

export type TokenStatus = 'none' | 'valid' | 'corrupted';

// ── Git Types ──

export interface GitBranch {
  name: string;
  isCurrent: boolean;
  hasUpstream: boolean;
  upstreamName: string | null;
  lastCommitDate: string; // ISO 8601
  lastCommitSha: string;
}

export interface GitSyncStatus {
  ahead: number;
  behind: number;
  hasUpstream: boolean;
  isDirty: boolean; // Only accurate for current branch
}

export interface GitCommit {
  sha: string;
  message: string;
  author: string;
  date: string; // ISO 8601
}

// ── Database Record Types ──

export interface Repo {
  id: number;
  path: string;
  displayName: string;
  lastOpened: string;
  createdAt: string;
}

export interface BranchRecord {
  id: number;
  repoId: number;
  branchName: string;
  status: BranchStatus;
  blockerType: BlockerType | null;
  blockerRef: string | null;
  nextStep: string;
  notes: string;
  manuallySetParent: string | null;
  lastSeen: string;
  hidden: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BranchFields {
  status: BranchStatus;
  blockerType: BlockerType | null;
  blockerRef: string | null;
  nextStep: string;
  notes: string;
  manuallySetParent: string | null;
}

// ── GitHub Types ──

export interface PRData {
  number: number;
  title: string;
  state: PRState;
  reviewState: ReviewState | null;
  checksState: ChecksState | null;
  commentCount: number;
  htmlUrl: string;
  headBranch: string;
}

export interface IssueData {
  number: number;
  title: string;
  state: 'open' | 'closed';
  htmlUrl: string;
}

export interface PRCacheEntry {
  prNumber: number;
  branchName: string;
  title: string;
  state: PRState;
  reviewState: ReviewState | null;
  checksState: ChecksState | null;
  commentCount: number;
  htmlUrl: string;
  fetchedAt: string;
}

// ── App Settings ──

export type BranchNameFontSize = 'sm' | 'md' | 'lg';

export interface AppSettings {
  stalenessThresholdDays: number; // Default: 30
  lastRepoId: number | null; // Auto-reopen on launch
  autoRefreshOnFocus: boolean; // Default: true
  refreshCooldownSeconds: number; // Default: 60
  showStaleWarnings: boolean; // Default: true
  showBranchPathInFull: boolean; // Default: false
  showCommitCountBadges: boolean; // Default: true
  branchNameFontSize: BranchNameFontSize; // Default: 'md'
  autoRefreshEnabled: boolean; // Default: true
  autoRefreshIntervalSeconds: number; // Default: 30
}

// ── Tree Types (renderer-only, but defined in shared for reuse) ──

export interface BranchTreeNode {
  branch: GitBranch;
  record: BranchRecord | null; // null if no DB record yet
  pr: PRData | null;
  parent: string | null; // Parent branch name
  children: BranchTreeNode[];
  depth: number; // 0 = root (main/master)
  syncStatus: GitSyncStatus | null;
}

// ── IPC Envelope ──

export type IPCResult<T> = { ok: true; data: T } | { ok: false; error: string };

// ── Refresh Types ──

export interface RefreshResult {
  branches: GitBranch[];
  currentBranch: string;
  statuses: Record<string, GitSyncStatus>;
  mergeBases: Record<string, string>; // branchName → merge-base SHA with root
  records: BranchRecord[];
  prCache: Record<string, PRCacheEntry>; // branchName → cached PR
  remoteInfo: { owner: string; repo: string } | null;
}

export interface BranchRefreshResult {
  branch: GitBranch;
  status: GitSyncStatus;
  record: BranchRecord;
  pr: PRCacheEntry | null;
}

