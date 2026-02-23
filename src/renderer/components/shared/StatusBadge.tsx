import type { BranchStatus } from '../../../shared/types';
import { BRANCH_STATUS_LABELS } from '../../../shared/constants';

interface StatusBadgeProps {
  status: BranchStatus;
  size?: 'sm' | 'md';
}

const STATUS_COLORS: Record<BranchStatus, string> = {
  active: 'bg-status-active',
  waiting_on_pr: 'bg-status-waiting',
  waiting_on_person: 'bg-status-waiting',
  blocked_by_issue: 'bg-status-blocked',
  ready_to_merge: 'bg-status-ready',
  stale: 'bg-status-stale',
  abandoned: 'bg-status-abandoned',
};

const STATUS_TEXT_COLORS: Record<BranchStatus, string> = {
  active: 'text-text-inverse',
  waiting_on_pr: 'text-text-inverse',
  waiting_on_person: 'text-text-inverse',
  blocked_by_issue: 'text-text-primary',
  ready_to_merge: 'text-text-inverse',
  stale: 'text-text-primary',
  abandoned: 'text-text-primary',
};

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const sizeClasses = size === 'sm' ? 'text-2xs px-2.5 py-0.5' : 'text-sm px-3 py-1';

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${STATUS_COLORS[status]} ${STATUS_TEXT_COLORS[status]} ${sizeClasses}`}
    >
      {BRANCH_STATUS_LABELS[status] ?? status}
    </span>
  );
}
