import React, { createContext, useContext, useState, useCallback } from 'react';
import type {
  BranchTreeNode,
  BranchRecord,
  PRCacheEntry,
  BranchFields,
  GitSyncStatus,
  GitCommit,
} from '../../shared/types';
import {
  DB_UPSERT_BRANCH,
  GIT_DELETE_BRANCH,
  GIT_GET_LOG,
  DB_SET_BRANCH_HIDDEN,
  MAX_COMMIT_HISTORY,
} from '../../shared/constants';
import { invoke } from '../lib/api';

interface BranchContextValue {
  tree: BranchTreeNode[];
  untrackedBranches: BranchTreeNode[];
  records: Map<string, BranchRecord>;
  prCache: Map<string, PRCacheEntry>;
  statuses: Map<string, GitSyncStatus>;
  selectedBranch: string | null;
  currentBranch: string | null;
  searchQuery: string;
  activeFilters: Set<string>;
  selectedBranchCommits: GitCommit[];
  isLoadingCommits: boolean;
  remoteInfo: { owner: string; repo: string } | null;
  defaultBranch: string | null;
  selectBranch: (branchName: string | null) => void;
  loadCommitsForBranch: (
    repoPath: string,
    branch: string,
    parentBranch: string
  ) => Promise<void>;
  updateBranchFields: (
    repoId: number,
    branchName: string,
    fields: Partial<BranchFields>
  ) => Promise<void>;
  setSearchQuery: (query: string) => void;
  toggleFilter: (status: string) => void;
  setManualParent: (
    repoId: number,
    branchName: string,
    parentName: string | null
  ) => Promise<void>;
  deleteBranch: (
    repoPath: string,
    repoId: number,
    branchName: string
  ) => Promise<void>;
  setTree: (tree: BranchTreeNode[]) => void;
  setUntrackedBranches: (branches: BranchTreeNode[]) => void;
  setRecords: (records: Map<string, BranchRecord>) => void;
  setPrCache: (cache: Map<string, PRCacheEntry>) => void;
  setStatuses: (statuses: Map<string, GitSyncStatus>) => void;
  setCurrentBranch: (branch: string | null) => void;
  setRemoteInfo: (info: { owner: string; repo: string } | null) => void;
  setDefaultBranch: (branch: string | null) => void;
}

const BranchContext = createContext<BranchContextValue | null>(null);

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const [tree, setTree] = useState<BranchTreeNode[]>([]);
  const [untrackedBranches, setUntrackedBranches] = useState<
    BranchTreeNode[]
  >([]);
  const [records, setRecords] = useState<Map<string, BranchRecord>>(
    new Map()
  );
  const [prCache, setPrCache] = useState<Map<string, PRCacheEntry>>(
    new Map()
  );
  const [statuses, setStatuses] = useState<Map<string, GitSyncStatus>>(
    new Map()
  );
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [currentBranch, setCurrentBranch] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [remoteInfo, setRemoteInfo] = useState<{
    owner: string;
    repo: string;
  } | null>(null);
  const [defaultBranch, setDefaultBranch] = useState<string | null>(null);
  const [selectedBranchCommits, setSelectedBranchCommits] = useState<
    GitCommit[]
  >([]);
  const [isLoadingCommits, setIsLoadingCommits] = useState(false);

  const selectBranch = useCallback((branchName: string | null) => {
    setSelectedBranch(branchName);
    if (!branchName) {
      setSelectedBranchCommits([]);
    }
  }, []);

  const loadCommitsForBranch = useCallback(
    async (repoPath: string, branch: string, parentBranch: string) => {
      setIsLoadingCommits(true);
      try {
        const result = await invoke<GitCommit[]>(GIT_GET_LOG, {
          repoPath,
          branch,
          parentBranch,
          limit: MAX_COMMIT_HISTORY,
        });

        if (result.ok) {
          setSelectedBranchCommits(result.data);
        } else {
          setSelectedBranchCommits([]);
        }
      } catch {
        setSelectedBranchCommits([]);
      } finally {
        setIsLoadingCommits(false);
      }
    },
    []
  );

  const updateBranchFields = useCallback(
    async (
      repoId: number,
      branchName: string,
      fields: Partial<BranchFields>
    ) => {
      const result = await invoke<BranchRecord>(DB_UPSERT_BRANCH, {
        repoId,
        branchName,
        fields,
      });

      if (result.ok) {
        setRecords((prev) => {
          const next = new Map(prev);
          next.set(branchName, result.data);
          return next;
        });
      }
    },
    []
  );

  const toggleFilter = useCallback((status: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  }, []);

  const setManualParent = useCallback(
    async (
      repoId: number,
      branchName: string,
      parentName: string | null
    ) => {
      await updateBranchFields(repoId, branchName, {
        manuallySetParent: parentName,
      });
    },
    [updateBranchFields]
  );

  const deleteBranch = useCallback(
    async (repoPath: string, repoId: number, branchName: string) => {
      const result = await invoke<void>(GIT_DELETE_BRANCH, {
        repoPath,
        branch: branchName,
      });

      if (result.ok) {
        await invoke(DB_SET_BRANCH_HIDDEN, {
          repoId,
          branchName,
          hidden: true,
        });

        // Remove from local state
        setRecords((prev) => {
          const next = new Map(prev);
          next.delete(branchName);
          return next;
        });
        if (selectedBranch === branchName) {
          setSelectedBranch(null);
        }
      } else {
        throw new Error(result.error);
      }
    },
    [selectedBranch]
  );

  return (
    <BranchContext.Provider
      value={{
        tree,
        untrackedBranches,
        records,
        prCache,
        statuses,
        selectedBranch,
        currentBranch,
        searchQuery,
        activeFilters,
        selectedBranchCommits,
        isLoadingCommits,
        remoteInfo,
        defaultBranch,
        selectBranch,
        loadCommitsForBranch,
        updateBranchFields,
        setSearchQuery,
        toggleFilter,
        setManualParent,
        deleteBranch,
        setTree,
        setUntrackedBranches,
        setRecords,
        setPrCache,
        setStatuses,
        setCurrentBranch,
        setRemoteInfo,
        setDefaultBranch,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch(): BranchContextValue {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error('useBranch must be used within a BranchProvider');
  return ctx;
}
