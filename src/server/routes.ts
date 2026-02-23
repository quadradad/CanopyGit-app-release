import type { Express, Request, Response } from 'express';
import type { IPCResult } from '../shared/types';
import type { GitService } from '../main/services/git';
import type { GitHubService } from '../main/services/github';
import type { DatabaseService } from '../main/services/database';
import type { SettingsService } from '../main/services/settings';
import type { RefreshService } from '../main/services/refresh';
import { execFile } from 'child_process';
import {
  GIT_LIST_BRANCHES,
  GIT_GET_STATUS,
  GIT_GET_LOG,
  GIT_GET_MERGE_BASE,
  GIT_GET_CURRENT_BRANCH,
  GIT_DELETE_BRANCH,
  GIT_VALIDATE_REPO,
  GITHUB_GET_PR_FOR_BRANCH,
  GITHUB_GET_PR_BY_NUMBER,
  GITHUB_GET_ISSUE,
  GITHUB_CHECK_TOKEN,
  GITHUB_GET_REMOTE_INFO,
  DB_GET_REPOS,
  DB_ADD_REPO,
  DB_REMOVE_REPO,
  DB_UPDATE_REPO_OPENED,
  DB_GET_BRANCH,
  DB_GET_BRANCHES,
  DB_UPSERT_BRANCH,
  DB_SET_BRANCH_HIDDEN,
  DB_UPSERT_PR_CACHE,
  DB_GET_CACHED_PR,
  DB_UPDATE_REPO_DISPLAY_NAME,
  APP_GET_SETTINGS,
  APP_SAVE_SETTINGS,
  APP_SAVE_GITHUB_TOKEN,
  APP_CLEAR_GITHUB_TOKEN,
  APP_HAS_GITHUB_TOKEN,
  APP_SELECT_FOLDER,
  APP_RESET_DATA,
  APP_REFRESH,
} from '../shared/constants';

export interface Services {
  gitService: GitService;
  githubService: GitHubService;
  databaseService: DatabaseService;
  settingsService: SettingsService;
  refreshService: RefreshService;
}

function ok<T>(data: T): IPCResult<T> {
  return { ok: true, data };
}

function fail<T>(error: string): IPCResult<T> {
  return { ok: false, error };
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

type ChannelHandler = (body: Record<string, unknown>) => Promise<IPCResult<unknown>>;

export function registerRoutes(app: Express, services: Services): void {
  const { gitService, githubService, databaseService, settingsService, refreshService } = services;

  // ── Health ──

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  // ── Channel Dispatch Map ──
  // Express 5's path-to-regexp treats ':' as a parameter delimiter, so we use
  // a single catch-all route and dispatch by channel name from a map.

  const handlers: Record<string, ChannelHandler> = {
    // Git
    [GIT_LIST_BRANCHES]: async (body) => {
      const result = await gitService.listBranches(body.repoPath as string);
      return ok(result);
    },
    [GIT_GET_STATUS]: async (body) => {
      const result = await gitService.getStatus(body.repoPath as string, body.branch as string);
      return ok(result);
    },
    [GIT_GET_LOG]: async (body) => {
      const result = await gitService.getLog(
        body.repoPath as string,
        body.branch as string,
        body.parentBranch as string,
        body.limit as number,
      );
      return ok(result);
    },
    [GIT_GET_MERGE_BASE]: async (body) => {
      const result = await gitService.getMergeBase(
        body.repoPath as string,
        body.branchA as string,
        body.branchB as string,
      );
      return ok(result);
    },
    [GIT_GET_CURRENT_BRANCH]: async (body) => {
      const result = await gitService.getCurrentBranch(body.repoPath as string);
      return ok(result);
    },
    [GIT_DELETE_BRANCH]: async (body) => {
      await gitService.deleteBranch(body.repoPath as string, body.branch as string);
      return ok(undefined);
    },
    [GIT_VALIDATE_REPO]: async (body) => {
      const result = await gitService.validateRepo(body.folderPath as string);
      return ok(result);
    },

    // GitHub
    [GITHUB_GET_PR_FOR_BRANCH]: async (body) => {
      const result = await githubService.getPRForBranch(
        body.owner as string,
        body.repo as string,
        body.branch as string,
      );
      return ok(result);
    },
    [GITHUB_GET_PR_BY_NUMBER]: async (body) => {
      const result = await githubService.getPRByNumber(
        body.owner as string,
        body.repo as string,
        body.prNumber as number,
      );
      return ok(result);
    },
    [GITHUB_GET_ISSUE]: async (body) => {
      const result = await githubService.getIssue(
        body.owner as string,
        body.repo as string,
        body.issueNumber as number,
      );
      return ok(result);
    },
    [GITHUB_CHECK_TOKEN]: async () => {
      const result = await githubService.checkToken();
      return ok(result);
    },
    [GITHUB_GET_REMOTE_INFO]: async (body) => {
      const result = await githubService.getRemoteInfo(body.repoPath as string);
      return ok(result);
    },

    // Database
    [DB_GET_REPOS]: async () => {
      const result = databaseService.getRepos();
      return ok(result);
    },
    [DB_ADD_REPO]: async (body) => {
      const result = databaseService.addRepo(body.path as string, body.displayName as string);
      return ok(result);
    },
    [DB_REMOVE_REPO]: async (body) => {
      databaseService.removeRepo(body.repoId as number);
      return ok(undefined);
    },
    [DB_UPDATE_REPO_OPENED]: async (body) => {
      databaseService.updateRepoOpened(body.repoId as number);
      return ok(undefined);
    },
    [DB_GET_BRANCH]: async (body) => {
      const result = databaseService.getBranch(body.repoId as number, body.branchName as string);
      return ok(result);
    },
    [DB_GET_BRANCHES]: async (body) => {
      const result = databaseService.getBranches(body.repoId as number);
      return ok(result);
    },
    [DB_UPSERT_BRANCH]: async (body) => {
      const result = databaseService.upsertBranch(
        body.repoId as number,
        body.branchName as string,
        body.fields as Record<string, unknown>,
      );
      return ok(result);
    },
    [DB_SET_BRANCH_HIDDEN]: async (body) => {
      databaseService.setBranchHidden(
        body.repoId as number,
        body.branchName as string,
        body.hidden as boolean,
      );
      return ok(undefined);
    },
    [DB_UPSERT_PR_CACHE]: async (body) => {
      databaseService.upsertPRCache(
        body.repoId as number,
        body.data as Parameters<typeof databaseService.upsertPRCache>[1],
      );
      return ok(undefined);
    },
    [DB_GET_CACHED_PR]: async (body) => {
      const result = databaseService.getCachedPR(body.repoId as number, body.branchName as string);
      return ok(result);
    },
    [DB_UPDATE_REPO_DISPLAY_NAME]: async (body) => {
      databaseService.updateRepoDisplayName(body.repoId as number, body.displayName as string);
      return ok(undefined);
    },

    // App
    [APP_SELECT_FOLDER]: async () => {
      return new Promise<IPCResult<string | null>>((resolve) => {
        execFile(
          'osascript',
          ['-e', 'POSIX path of (choose folder with prompt "Select a Git repository")'],
          (error, stdout) => {
            if (error) {
              // User cancelled or osascript failed
              resolve(ok(null));
              return;
            }
            const folderPath = stdout.trim().replace(/\/+$/, '');
            resolve(ok(folderPath));
          },
        );
      });
    },
    [APP_GET_SETTINGS]: async () => {
      const result = settingsService.getSettings();
      return ok(result);
    },
    [APP_SAVE_SETTINGS]: async (body) => {
      settingsService.saveSettings(body.settings as Parameters<typeof settingsService.saveSettings>[0]);
      return ok(undefined);
    },
    [APP_SAVE_GITHUB_TOKEN]: async (body) => {
      settingsService.saveGitHubToken(body.token as string);
      githubService.reinitialize();
      return ok(undefined);
    },
    [APP_CLEAR_GITHUB_TOKEN]: async () => {
      settingsService.clearGitHubToken();
      githubService.reinitialize();
      return ok(undefined);
    },
    [APP_HAS_GITHUB_TOKEN]: async () => {
      const result = settingsService.hasGitHubToken();
      return ok(result);
    },
    [APP_RESET_DATA]: async () => {
      // In web mode, reset clears the database and settings.
      // The client handles page reload.
      databaseService.reset();
      settingsService.clearAll();
      return ok(undefined);
    },
    [APP_REFRESH]: async (body) => {
      const result = await refreshService.refresh(
        body.repoPath as string,
        body.repoId as number,
      );
      return ok(result);
    },
  };

  // ── Single Dispatch Route ──
  // All API calls go through POST /api/* and are dispatched by channel name.

  app.post('/api/{*channel}', async (req: Request, res: Response) => {
    const channel = Array.isArray(req.params.channel)
      ? req.params.channel.join('/')
      : req.params.channel;
    const handler = handlers[channel];

    if (!handler) {
      res.status(404).json({ ok: false, error: `Unknown channel: ${channel}` });
      return;
    }

    try {
      const result = await handler(req.body || {});
      res.json(result);
    } catch (error) {
      res.json(fail(errorMessage(error)));
    }
  });
}
