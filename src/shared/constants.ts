// ── IPC Channel Names ──

// Git channels
export const GIT_LIST_BRANCHES = 'git:list-branches' as const;
export const GIT_GET_STATUS = 'git:get-status' as const;
export const GIT_GET_LOG = 'git:get-log' as const;
export const GIT_GET_MERGE_BASE = 'git:get-merge-base' as const;
export const GIT_GET_CURRENT_BRANCH = 'git:get-current-branch' as const;
export const GIT_DELETE_BRANCH = 'git:delete-branch' as const;
export const GIT_VALIDATE_REPO = 'git:validate-repo' as const;

// GitHub channels
export const GITHUB_GET_PR_FOR_BRANCH = 'github:get-pr-for-branch' as const;
export const GITHUB_GET_PR_BY_NUMBER = 'github:get-pr-by-number' as const;
export const GITHUB_GET_ISSUE = 'github:get-issue' as const;
export const GITHUB_CHECK_TOKEN = 'github:check-token' as const;
export const GITHUB_GET_REMOTE_INFO = 'github:get-remote-info' as const;

// Database channels
export const DB_GET_REPOS = 'db:get-repos' as const;
export const DB_ADD_REPO = 'db:add-repo' as const;
export const DB_REMOVE_REPO = 'db:remove-repo' as const;
export const DB_UPDATE_REPO_OPENED = 'db:update-repo-opened' as const;
export const DB_GET_BRANCH = 'db:get-branch' as const;
export const DB_GET_BRANCHES = 'db:get-branches' as const;
export const DB_UPSERT_BRANCH = 'db:upsert-branch' as const;
export const DB_SET_BRANCH_HIDDEN = 'db:set-branch-hidden' as const;
export const DB_UPSERT_PR_CACHE = 'db:upsert-pr-cache' as const;
export const DB_GET_CACHED_PR = 'db:get-cached-pr' as const;
export const DB_UPDATE_REPO_DISPLAY_NAME = 'db:update-repo-display-name' as const;

// App channels
export const APP_SELECT_FOLDER = 'app:select-folder' as const;
export const APP_GET_SETTINGS = 'app:get-settings' as const;
export const APP_SAVE_SETTINGS = 'app:save-settings' as const;
export const APP_SAVE_GITHUB_TOKEN = 'app:save-github-token' as const;
export const APP_CLEAR_GITHUB_TOKEN = 'app:clear-github-token' as const;
export const APP_HAS_GITHUB_TOKEN = 'app:has-github-token' as const;
export const APP_RESET_DATA = 'app:reset-data' as const;
export const APP_REFRESH = 'app:refresh' as const;

// ── Status Values ──

export const BRANCH_STATUSES = [
  'active',
  'waiting_on_pr',
  'waiting_on_person',
  'blocked_by_issue',
  'ready_to_merge',
  'stale',
  'abandoned',
] as const;

export const BRANCH_STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  waiting_on_pr: 'Waiting on PR',
  waiting_on_person: 'Waiting on Person',
  blocked_by_issue: 'Blocked by Issue',
  ready_to_merge: 'Ready to Merge',
  stale: 'Stale',
  abandoned: 'Abandoned',
};

// ── Default Values ──

export const DEFAULT_STALENESS_THRESHOLD_DAYS = 30;
export const PR_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
export const FOCUS_REFRESH_DEBOUNCE_MS = 60 * 1000; // 60 seconds
export const DEFAULT_AUTO_REFRESH_INTERVAL_MS = 30 * 1000; // 30 seconds
export const AUTO_SAVE_DEBOUNCE_MS = 1000; // 1 second
export const SEARCH_DEBOUNCE_MS = 150; // 150ms
export const MAX_TREE_DEPTH = 8;
export const MAX_RECENT_REPOS = 5;
export const MAX_COMMIT_HISTORY = 10;
