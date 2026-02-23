import { useCallback, useEffect } from 'react';
import type { BranchTreeNode, BranchStatus, BlockerType } from '../../../shared/types';
import { useBranch } from '../../contexts/BranchContext';
import { useGitHub } from '../../contexts/GitHubContext';
import { useRepo } from '../../contexts/RepoContext';
import { GitHubBanner } from '../shared/GitHubBanner';
import { BranchHeader } from './BranchHeader';
import { SyncStatus } from './SyncStatus';
import { PRSection } from './PRSection';
import { StatusPicker } from './StatusPicker';
import { BlockerField } from './BlockerField';
import { DependencyPicker } from './DependencyPicker';
import { NextStepField } from './NextStepField';
import { NotesField } from './NotesField';
import { CommitHistory } from './CommitHistory';
import { DangerZone } from './DangerZone';
import { FreshRepoCTA } from './FreshRepoCTA';

function findNode(
  tree: BranchTreeNode[],
  branchName: string
): BranchTreeNode | null {
  for (const node of tree) {
    if (node.branch.name === branchName) return node;
    const found = findNode(node.children, branchName);
    if (found) return found;
  }
  return null;
}

const BLOCKING_STATUSES = new Set<string>([
  'waiting_on_pr',
  'waiting_on_person',
  'blocked_by_issue',
]);

export function DetailPanel() {
  const {
    selectedBranch, tree, untrackedBranches, remoteInfo, records,
    updateBranchFields, selectedBranchCommits, isLoadingCommits,
    loadCommitsForBranch, defaultBranch,
  } = useBranch();
  const { isConnected, tokenCorrupted } = useGitHub();
  const { openSettings, currentRepo } = useRepo();

  const node = selectedBranch
    ? (findNode(tree, selectedBranch) ?? findNode(untrackedBranches, selectedBranch))
    : null;

  const record = selectedBranch ? records.get(selectedBranch) : null;
  const repoId = currentRepo?.id ?? 0;

  const handleStatusChange = useCallback(
    (status: BranchStatus, blockerType?: BlockerType) => {
      if (!selectedBranch || !repoId) return;
      void updateBranchFields(repoId, selectedBranch, {
        status,
        blockerType: blockerType ?? null,
        blockerRef: blockerType ? (record?.blockerRef ?? '') : null,
      });
    },
    [selectedBranch, repoId, updateBranchFields, record?.blockerRef]
  );

  const handleBlockerRefChange = useCallback(
    (ref: string) => {
      if (!selectedBranch || !repoId) return;
      void updateBranchFields(repoId, selectedBranch, { blockerRef: ref });
    },
    [selectedBranch, repoId, updateBranchFields]
  );

  const handleNextStepChange = useCallback(
    async (value: string) => {
      if (!selectedBranch || !repoId) return;
      await updateBranchFields(repoId, selectedBranch, { nextStep: value });
    },
    [selectedBranch, repoId, updateBranchFields]
  );

  const handleNotesChange = useCallback(
    async (value: string) => {
      if (!selectedBranch || !repoId) return;
      await updateBranchFields(repoId, selectedBranch, { notes: value });
    },
    [selectedBranch, repoId, updateBranchFields]
  );

  // Fetch commits when branch selection changes
  useEffect(() => {
    if (!selectedBranch || !node || !currentRepo) return;
    const parentBranch = node.parent ?? defaultBranch ?? 'main';
    void loadCommitsForBranch(currentRepo.path, selectedBranch, parentBranch);
  }, [selectedBranch, node?.parent, currentRepo?.path, defaultBranch, loadCommitsForBranch]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!selectedBranch || !node) return null;

  const currentStatus = record?.status ?? 'active';
  const isBlocking = BLOCKING_STATUSES.has(currentStatus);

  return (
    <div className="h-full overflow-y-auto px-12 py-8 space-y-8 max-w-4xl mx-auto">
      <BranchHeader
        node={node}
        totalBranches={records.size}
        isDefaultBranch={selectedBranch === defaultBranch}
      />

      <SyncStatus syncStatus={node.syncStatus} />

      <PRSection key={`pr-${selectedBranch}`} pr={node.pr} remoteInfo={remoteInfo} />

      <div className="space-y-3">
        <StatusPicker currentStatus={currentStatus} onChange={handleStatusChange} />
        {isBlocking && record?.blockerType === 'pr' && (
          <DependencyPicker
            key={`dep-${selectedBranch}`}
            currentBranch={selectedBranch}
            blockerRef={record.blockerRef}
            onChange={handleBlockerRefChange}
          />
        )}
        {isBlocking && record?.blockerType && record.blockerType !== 'pr' && (
          <BlockerField
            key={`blocker-${selectedBranch}`}
            blockerType={record.blockerType}
            blockerRef={record.blockerRef}
            onChange={handleBlockerRefChange}
          />
        )}
      </div>

      <NextStepField key={`nextstep-${selectedBranch}`} value={record?.nextStep ?? ''} onChange={handleNextStepChange} />

      <NotesField key={`notes-${selectedBranch}`} value={record?.notes ?? ''} onChange={handleNotesChange} />

      <CommitHistory
        commits={selectedBranchCommits}
        remoteInfo={remoteInfo}
        branch={selectedBranch}
        parentBranch={node.parent}
        isLoading={isLoadingCommits}
      />

      <FreshRepoCTA branchCount={records.size + untrackedBranches.length} />

      <DangerZone
        branchName={selectedBranch}
        hasPR={node.pr !== null}
        prState={node.pr?.state ?? null}
      />

      {(!isConnected || tokenCorrupted) && <GitHubBanner onOpenSettings={openSettings} corrupted={tokenCorrupted} />}
    </div>
  );
}
