import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Repo } from '../../shared/types';
import {
  DB_GET_REPOS,
  GIT_VALIDATE_REPO,
  DB_ADD_REPO,
  APP_GET_SETTINGS,
  DB_UPDATE_REPO_OPENED,
  APP_SAVE_SETTINGS,
  GITHUB_GET_REMOTE_INFO,
} from '../../shared/constants';
import { invoke } from '../lib/api';

interface RepoContextValue {
  currentRepo: Repo | null;
  repos: Repo[];
  isLoading: boolean;
  settingsOpen: boolean;
  selectRepo: (repo: Repo) => Promise<void>;
  openNewRepo: (folderPath: string) => Promise<void>;
  loadRepos: () => Promise<void>;
  openSettings: () => void;
  closeSettings: () => void;
}

const RepoContext = createContext<RepoContextValue | null>(null);

export function RepoProvider({ children }: { children: React.ReactNode }) {
  const [currentRepo, setCurrentRepo] = useState<Repo | null>(null);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const loadRepos = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await invoke<Repo[]>(DB_GET_REPOS);
      if (result.ok) {
        setRepos(result.data);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectRepo = useCallback(
    async (repo: Repo) => {
      setCurrentRepo(repo);
      await invoke(DB_UPDATE_REPO_OPENED, { repoId: repo.id });
      await invoke(APP_SAVE_SETTINGS, { settings: { lastRepoId: repo.id } });
    },
    []
  );

  const openNewRepo = useCallback(async (folderPath: string) => {
    // Strip trailing slashes defensively (osascript adds them)
    const cleanPath = folderPath.replace(/\/+$/, '');

    // Validate it's a git repo
    const validateResult = await invoke<{ isRepo: boolean; defaultBranch: string | null }>(
      GIT_VALIDATE_REPO, { folderPath: cleanPath }
    );
    if (!validateResult.ok || !validateResult.data.isRepo) return;

    // Try GitHub owner/repo format, fall back to folder basename
    let displayName = cleanPath.split('/').pop() || cleanPath;
    const remoteResult = await invoke<{ owner: string; repo: string } | null>(
      GITHUB_GET_REMOTE_INFO, { repoPath: cleanPath }
    );
    if (remoteResult.ok && remoteResult.data) {
      displayName = `${remoteResult.data.owner}/${remoteResult.data.repo}`;
    }

    const addResult = await invoke<Repo>(DB_ADD_REPO, { path: cleanPath, displayName });
    if (!addResult.ok) return;

    await selectRepo(addResult.data);
    await loadRepos();
  }, [selectRepo, loadRepos]);

  // Load repos on mount and auto-select last repo
  useEffect(() => {
    async function init() {
      await loadRepos();

      const settingsResult = await invoke<{ stalenessThresholdDays: number; lastRepoId: number | null }>(
        APP_GET_SETTINGS
      );

      if (settingsResult.ok && settingsResult.data.lastRepoId) {
        const reposResult = await invoke<Repo[]>(DB_GET_REPOS);
        if (reposResult.ok) {
          const lastRepo = reposResult.data.find(
            (r) => r.id === settingsResult.data.lastRepoId
          );
          if (lastRepo) {
            setCurrentRepo(lastRepo);
          }
        }
      }
    }
    void init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <RepoContext.Provider
      value={{
        currentRepo,
        repos,
        isLoading,
        settingsOpen,
        selectRepo,
        openNewRepo,
        loadRepos,
        openSettings: () => setSettingsOpen(true),
        closeSettings: () => setSettingsOpen(false),
      }}
    >
      {children}
    </RepoContext.Provider>
  );
}

export function useRepo(): RepoContextValue {
  const ctx = useContext(RepoContext);
  if (!ctx) throw new Error('useRepo must be used within a RepoProvider');
  return ctx;
}
