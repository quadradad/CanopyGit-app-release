import type { PRState } from '../../../shared/types';

interface PRBadgeProps {
  prNumber: number;
  state: PRState;
}

const STATE_LABELS: Record<PRState, string> = {
  open: 'Open',
  merged: 'Merged',
  closed: 'Closed',
  draft: 'Draft',
};

const STATE_BADGE_STYLES: Record<PRState, string> = {
  open: 'border-pr-open text-pr-open',
  merged: 'border-pr-merged text-pr-merged',
  closed: 'border-pr-closed text-pr-closed',
  draft: 'border-pr-draft text-pr-draft',
};

const STATE_DOT_COLORS: Record<PRState, string> = {
  open: 'bg-pr-open',
  merged: 'bg-pr-merged',
  closed: 'bg-pr-closed',
  draft: 'bg-pr-draft',
};

export function PRBadge({ state }: PRBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-2xs font-medium border ${STATE_BADGE_STYLES[state]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${STATE_DOT_COLORS[state]}`} />
      {STATE_LABELS[state]}
    </span>
  );
}
