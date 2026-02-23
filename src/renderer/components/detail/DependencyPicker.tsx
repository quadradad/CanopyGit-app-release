import { useBranch } from '../../contexts/BranchContext';

interface DependencyPickerProps {
  currentBranch: string;
  blockerRef: string | null;
  onChange: (prNumber: string) => void;
}

const REVIEW_LABELS: Record<string, string> = {
  pending: 'Pending',
  changes_requested: 'Changes Requested',
  approved: 'Approved',
};

export function DependencyPicker({ currentBranch, blockerRef, onChange }: DependencyPickerProps) {
  const { prCache } = useBranch();

  // Filter to open PRs on other branches
  const options = Array.from(prCache.values())
    .filter((pr) => pr.state === 'open' && pr.branchName !== currentBranch)
    .sort((a, b) => a.branchName.localeCompare(b.branchName));

  return (
    <select
      value={blockerRef ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-1.5 text-sm bg-bg-input border border-border-default rounded-md text-text-primary focus:outline-none focus:border-accent transition-colors"
    >
      <option value="">Select a branch PR…</option>
      {options.map((pr) => {
        const reviewLabel = pr.reviewState ? ` (${REVIEW_LABELS[pr.reviewState] ?? pr.reviewState})` : '';
        return (
          <option key={pr.prNumber} value={String(pr.prNumber)}>
            {pr.branchName} — #{pr.prNumber}{reviewLabel}
          </option>
        );
      })}
    </select>
  );
}
