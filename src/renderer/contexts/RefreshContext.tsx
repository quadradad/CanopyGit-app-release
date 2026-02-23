import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type {
  AppSettings,
  RefreshResult,
  BranchRecord,
  PRCacheEntry,
  GitSyncStatus,
} from '../../shared/types';
import {
  GIT_VALIDATE_REPO,
  APP_REFRESH,
  APP_GET_SETTINGS,
  FOCUS_REFRESH_DEBOUNCE_MS,
  DEFAULT_AUTO_REFRESH_INTERVAL_MS,
} from '../../shared/constants';
import { invoke } from '../lib/api';
import { useRepo } from './RepoContext';
import { useBranch } from './BranchContext';
import { buildBranchTree } from '../lib/tree-builder';

interface RefreshContextValue {
  isRefreshing: boolean;
  lastRefreshedAt: Date | null;
  refresh: () => Promise<void>;
}

const RefreshContext = createContext<RefreshContextValue | null>(null);

export function RefreshProvider({ children }: { children: React.ReactNode }) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const lastRefreshTimeRef = useRef(0);

  const { currentRepo, loadRepos } = useRepo();
  const branch = useBranch();

  const refresh = useCallback(async () => {
    if (!currentRepo) return;

    setIsRefreshing(true);
    try {
      // Validate repo still exists
      const validateResult = await invoke<{ isRepo: boolean; defaultBranch: string | null }>(
        GIT_VALIDATE_REPO, { folderPath: currentRepo.path }
      );

      if (!validateResult.ok || !validateResult.data.isRepo) return;

      const defaultBranchName = validateResult.data.defaultBranch ?? 'main';
      branch.setDefaultBranch(defaultBranchName);

      // Single server call for all refresh data
      const refreshResult = await invoke<RefreshResult>(APP_REFRESH, {
        repoPath: currentRepo.path,
        repoId: currentRepo.id,
      });

      if (!refreshResult.ok) return;

      const data = refreshResult.data;

      // Populate branch context
      branch.setCurrentBranch(data.currentBranch);

      const statusMap = new Map<string, GitSyncStatus>(Object.entries(data.statuses));
      branch.setStatuses(statusMap);

      const recordMap = new Map<string, BranchRecord>(
        data.records.map((r) => [r.branchName, r])
      );
      branch.setRecords(recordMap);

      const prCacheMap = new Map<string, PRCacheEntry>(Object.entries(data.prCache));
      branch.setPrCache(prCacheMap);

      branch.setRemoteInfo(data.remoteInfo);

      // Build tree with real PR data
      const treeResult = buildBranchTree({
        branches: data.branches,
        records: data.records,
        mergeBases: data.mergeBases,
        prCache: data.prCache,
        statuses: data.statuses,
        defaultBranch: defaultBranchName,
      });

      branch.setTree(treeResult.tree);
      branch.setUntrackedBranches(treeResult.untracked);

      setLastRefreshedAt(new Date());
      lastRefreshTimeRef.current = Date.now();

      // Reload repos so updated display names are reflected in sidebar
      await loadRepos();
    } finally {
      setIsRefreshing(false);
    }
  }, [currentRepo, branch, loadRepos]);

  // Auto-refresh on repo change
  useEffect(() => {
    if (currentRepo) {
      void refresh();
    }
  }, [currentRepo?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Background polling + visibility-based refresh
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let disposed = false;

    async function setup() {
      const settingsResult = await invoke<AppSettings>(APP_GET_SETTINGS);
      if (disposed) return;

      const pollingEnabled = settingsResult.ok
        ? settingsResult.data.autoRefreshEnabled
        : true;
      const pollingIntervalMs = settingsResult.ok
        ? settingsResult.data.autoRefreshIntervalSeconds * 1000
        : DEFAULT_AUTO_REFRESH_INTERVAL_MS;
      const focusRefreshEnabled = settingsResult.ok
        ? settingsResult.data.autoRefreshOnFocus
        : true;
      const cooldownMs = settingsResult.ok
        ? settingsResult.data.refreshCooldownSeconds * 1000
        : FOCUS_REFRESH_DEBOUNCE_MS;

      function startPolling() {
        stopPolling();
        if (pollingEnabled) {
          intervalId = setInterval(() => {
            void refresh();
          }, pollingIntervalMs);
        }
      }

      function stopPolling() {
        if (intervalId !== null) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }

      function handleVisibilityChange() {
        if (document.visibilityState === 'visible') {
          // Tab became visible — immediate refresh + restart polling
          if (pollingEnabled) {
            void refresh();
            startPolling();
          } else if (focusRefreshEnabled) {
            // Fallback to legacy focus-refresh with cooldown
            const now = Date.now();
            if (now - lastRefreshTimeRef.current > cooldownMs) {
              void refresh();
            }
          }
        } else {
          // Tab hidden — pause polling
          stopPolling();
        }
      }

      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Start polling immediately if tab is visible
      if (document.visibilityState === 'visible') {
        startPolling();
      }

      // Store cleanup references
      return () => {
        stopPolling();
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }

    let cleanup: (() => void) | undefined;
    void setup().then((fn) => {
      if (disposed) {
        fn?.();
      } else {
        cleanup = fn;
      }
    });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [refresh]);

  return (
    <RefreshContext.Provider
      value={{ isRefreshing, lastRefreshedAt, refresh }}
    >
      {children}
    </RefreshContext.Provider>
  );
}

export function useRefresh(): RefreshContextValue {
  const ctx = useContext(RefreshContext);
  if (!ctx)
    throw new Error('useRefresh must be used within a RefreshProvider');
  return ctx;
}
