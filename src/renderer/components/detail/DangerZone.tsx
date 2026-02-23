import { useState } from 'react';
import type { PRState } from '../../../shared/types';
import { useBranch } from '../../contexts/BranchContext';
import { useRepo } from '../../contexts/RepoContext';
import { ChevronIcon } from '../icons';
import { ConfirmDialog } from '../shared/ConfirmDialog';

interface DangerZoneProps {
  branchName: string;
  hasPR: boolean;
  prState: PRState | null;
}

export function DangerZone({ branchName, hasPR, prState }: DangerZoneProps) {
  const { deleteBranch } = useBranch();
  const { currentRepo } = useRepo();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!currentRepo) return;
    setIsDeleting(true);
    try {
      await deleteBranch(currentRepo.path, currentRepo.id, branchName);
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  const hasUnmergedPR = hasPR && prState !== 'merged';

  return (
    <>
      <div className="border-t border-border-default pt-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 text-xs text-text-secondary uppercase tracking-[0.1em] hover:text-text-primary transition-colors"
        >
          <ChevronIcon
            size={10}
            className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
          />
          Danger Zone
        </button>

        {isExpanded && (
          <div className="mt-3">
            <button
              onClick={() => setShowConfirm(true)}
              disabled={isDeleting}
              className="px-4 py-2 text-sm text-white bg-error hover:bg-error-hover rounded-md transition-colors disabled:opacity-50"
            >
              {isDeleting ? 'Deleting…' : 'Delete Branch'}
            </button>
          </div>
        )}
      </div>

      {showConfirm && (
        <ConfirmDialog
          title="Delete Branch"
          message={`Are you sure you want to delete "${branchName}"? This will remove the local branch.`}
          confirmLabel="Delete"
          warning={
            hasUnmergedPR
              ? 'This branch has an open/draft PR that has not been merged.'
              : undefined
          }
          onConfirm={() => void handleDelete()}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}
