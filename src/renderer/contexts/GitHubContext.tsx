import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { TokenStatus } from '../../shared/types';
import {
  APP_SAVE_GITHUB_TOKEN,
  APP_CLEAR_GITHUB_TOKEN,
  APP_HAS_GITHUB_TOKEN,
  GITHUB_CHECK_TOKEN,
} from '../../shared/constants';
import { invoke } from '../lib/api';

interface GitHubContextValue {
  isConnected: boolean;
  username: string | null;
  tokenCorrupted: boolean;
  saveToken: (token: string) => Promise<void>;
  clearToken: () => Promise<void>;
  checkConnection: () => Promise<void>;
}

const GitHubContext = createContext<GitHubContextValue | null>(null);

export function GitHubProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [tokenCorrupted, setTokenCorrupted] = useState(false);

  const checkConnection = useCallback(async () => {
    const statusResult = await invoke<TokenStatus>(APP_HAS_GITHUB_TOKEN);

    if (!statusResult.ok) {
      setIsConnected(false);
      setUsername(null);
      setTokenCorrupted(false);
      return;
    }

    const status = statusResult.data;

    if (status === 'corrupted') {
      setIsConnected(false);
      setUsername(null);
      setTokenCorrupted(true);
      return;
    }

    if (status === 'none') {
      setIsConnected(false);
      setUsername(null);
      setTokenCorrupted(false);
      return;
    }

    // status === 'valid' — verify with GitHub
    const checkResult = await invoke<{ valid: boolean; login: string | null }>(
      GITHUB_CHECK_TOKEN
    );

    if (checkResult.ok && checkResult.data.valid) {
      setIsConnected(true);
      setUsername(checkResult.data.login);
    } else {
      setIsConnected(false);
      setUsername(null);
    }
    setTokenCorrupted(false);
  }, []);

  const saveToken = useCallback(
    async (token: string) => {
      const result = await invoke<void>(APP_SAVE_GITHUB_TOKEN, { token });

      if (!result.ok) {
        throw new Error(result.error);
      }

      await checkConnection();
    },
    [checkConnection]
  );

  const clearToken = useCallback(async () => {
    await invoke(APP_CLEAR_GITHUB_TOKEN);
    setIsConnected(false);
    setUsername(null);
    setTokenCorrupted(false);
  }, []);

  // Check connection on mount
  useEffect(() => {
    void checkConnection();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <GitHubContext.Provider
      value={{
        isConnected,
        username,
        tokenCorrupted,
        saveToken,
        clearToken,
        checkConnection,
      }}
    >
      {children}
    </GitHubContext.Provider>
  );
}

export function useGitHub(): GitHubContextValue {
  const ctx = useContext(GitHubContext);
  if (!ctx) throw new Error('useGitHub must be used within a GitHubProvider');
  return ctx;
}
