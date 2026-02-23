import type { GitSyncStatus } from '../../../shared/types';

interface SyncStatusProps {
  syncStatus: GitSyncStatus | null;
}

function formatSync(status: GitSyncStatus): { text: string; isGood: boolean } {
  if (!status.hasUpstream) return { text: 'Never pushed', isGood: false };

  if (status.ahead === 0 && status.behind === 0) {
    return { text: 'Up to date with origin', isGood: true };
  }

  if (status.ahead > 0 && status.behind > 0) {
    return {
      text: `${status.ahead} ahead · ${status.behind} behind origin`,
      isGood: false,
    };
  }

  if (status.ahead > 0) {
    return {
      text: `${status.ahead} commit${status.ahead !== 1 ? 's' : ''} ahead of origin`,
      isGood: true,
    };
  }

  return {
    text: `${status.behind} commits behind origin`,
    isGood: false,
  };
}

export function SyncStatus({ syncStatus }: SyncStatusProps) {
  if (!syncStatus) return null;

  const { text, isGood } = formatSync(syncStatus);

  return (
    <div className="flex items-center gap-1.5 text-sm text-text-secondary">
      <span className={`w-2 h-2 rounded-full ${isGood ? 'bg-success' : 'bg-warning'}`} />
      {text}
    </div>
  );
}
