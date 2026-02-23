import type { BranchStatus, BlockerType } from '../../../shared/types';
import { BRANCH_STATUSES, BRANCH_STATUS_LABELS } from '../../../shared/constants';

interface StatusPickerProps {
  currentStatus: BranchStatus;
  onChange: (status: BranchStatus, blockerType?: BlockerType) => void;
}

const STATUS_SELECTED_CLASSES: Record<BranchStatus, string> = {
  active: 'bg-status-active border-2 border-status-active text-white',
  waiting_on_pr: 'bg-status-waiting border-2 border-status-waiting text-white',
  waiting_on_person: 'bg-status-waiting border-2 border-status-waiting text-white',
  blocked_by_issue: 'bg-status-blocked border-2 border-status-blocked text-white',
  ready_to_merge: 'bg-status-ready border-2 border-status-ready text-white',
  stale: 'bg-status-stale border-2 border-status-stale text-white',
  abandoned: 'bg-status-abandoned border-2 border-status-abandoned text-white',
};

const BLOCKER_TYPE_MAP: Partial<Record<BranchStatus, BlockerType>> = {
  waiting_on_pr: 'pr',
  waiting_on_person: 'person',
  blocked_by_issue: 'issue',
};

export function StatusPicker({ currentStatus, onChange }: StatusPickerProps) {
  const handleClick = (status: BranchStatus) => {
    const blockerType = BLOCKER_TYPE_MAP[status];
    onChange(status, blockerType);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs text-text-secondary uppercase tracking-[0.1em]">
        Status
      </label>
      <div className="flex flex-wrap gap-2">
        {BRANCH_STATUSES.map((status) => {
          const isSelected = status === currentStatus;
          return (
            <button
              key={status}
              onClick={() => handleClick(status)}
              className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                isSelected
                  ? STATUS_SELECTED_CLASSES[status]
                  : 'border border-border-default text-text-secondary hover:bg-bg-surface-hover'
              }`}
            >
              {BRANCH_STATUS_LABELS[status]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
