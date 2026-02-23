import type {
  GitBranch,
  GitSyncStatus,
  GitCommit,
  Repo,
  BranchRecord,
  BranchFields,
  PRData,
  IssueData,
  PRCacheEntry,
  AppSettings,
  TokenStatus,
} from './types';

// ── Git Channel Types ──

export interface GitListBranchesRequest {
  repoPath: string;
}
export type GitListBranchesResponse = GitBranch[];

export interface GitGetStatusRequest {
  repoPath: string;
  branch: string;
}
export type GitGetStatusResponse = GitSyncStatus;

export interface GitGetLogRequest {
  repoPath: string;
  branch: string;
  parentBranch: string;
  limit: number;
}
export type GitGetLogResponse = GitCommit[];

export interface GitGetMergeBaseRequest {
  repoPath: string;
  branchA: string;
  branchB: string;
}
export type GitGetMergeBaseResponse = string;

export interface GitGetCurrentBranchRequest {
  repoPath: string;
}
export type GitGetCurrentBranchResponse = string;

export interface GitDeleteBranchRequest {
  repoPath: string;
  branch: string;
}
export type GitDeleteBranchResponse = void;

export interface GitValidateRepoRequest {
  folderPath: string;
}
export interface GitValidateRepoResponse {
  isRepo: boolean;
  defaultBranch: string | null;
}

// ── GitHub Channel Types ──

export interface GitHubGetPRForBranchRequest {
  owner: string;
  repo: string;
  branch: string;
}
export type GitHubGetPRForBranchResponse = PRData | null;

export interface GitHubGetPRByNumberRequest {
  owner: string;
  repo: string;
  prNumber: number;
}
export type GitHubGetPRByNumberResponse = PRData | null;

export interface GitHubGetIssueRequest {
  owner: string;
  repo: string;
  issueNumber: number;
}
export type GitHubGetIssueResponse = IssueData | null;

export type GitHubCheckTokenRequest = Record<string, never>;
export interface GitHubCheckTokenResponse {
  valid: boolean;
  login: string | null;
  scopes: string[];
  expiresAt: string | null;
}

export interface GitHubGetRemoteInfoRequest {
  repoPath: string;
}
export type GitHubGetRemoteInfoResponse = { owner: string; repo: string } | null;

// ── Database Channel Types ──

export type DBGetReposRequest = Record<string, never>;
export type DBGetReposResponse = Repo[];

export interface DBAddRepoRequest {
  path: string;
  displayName: string;
}
export type DBAddRepoResponse = Repo;

export interface DBRemoveRepoRequest {
  repoId: number;
}
export type DBRemoveRepoResponse = void;

export interface DBUpdateRepoOpenedRequest {
  repoId: number;
}
export type DBUpdateRepoOpenedResponse = void;

export interface DBGetBranchRequest {
  repoId: number;
  branchName: string;
}
export type DBGetBranchResponse = BranchRecord | null;

export interface DBGetBranchesRequest {
  repoId: number;
}
export type DBGetBranchesResponse = BranchRecord[];

export interface DBUpsertBranchRequest {
  repoId: number;
  branchName: string;
  fields: Partial<BranchFields>;
}
export type DBUpsertBranchResponse = BranchRecord;

export interface DBSetBranchHiddenRequest {
  repoId: number;
  branchName: string;
  hidden: boolean;
}
export type DBSetBranchHiddenResponse = void;

export interface DBUpsertPRCacheRequest {
  repoId: number;
  data: PRCacheEntry;
}
export type DBUpsertPRCacheResponse = void;

export interface DBGetCachedPRRequest {
  repoId: number;
  branchName: string;
}
export type DBGetCachedPRResponse = PRCacheEntry | null;

export interface DBUpdateRepoDisplayNameRequest {
  repoId: number;
  displayName: string;
}
export type DBUpdateRepoDisplayNameResponse = void;

// ── App Channel Types ──

export type AppSelectFolderRequest = Record<string, never>;
export type AppSelectFolderResponse = string | null;

export type AppGetSettingsRequest = Record<string, never>;
export type AppGetSettingsResponse = AppSettings;

export interface AppSaveSettingsRequest {
  settings: Partial<AppSettings>;
}
export type AppSaveSettingsResponse = void;

export interface AppSaveGitHubTokenRequest {
  token: string;
}
export type AppSaveGitHubTokenResponse = void;

export type AppClearGitHubTokenRequest = Record<string, never>;
export type AppClearGitHubTokenResponse = void;

export type AppHasGitHubTokenRequest = Record<string, never>;
export type AppHasGitHubTokenResponse = TokenStatus;

export type AppResetDataRequest = Record<string, never>;
export type AppResetDataResponse = void;

export interface AppRefreshRequest {
  repoPath: string;
  repoId: number;
}
export type AppRefreshResponse = import('./types').RefreshResult;
