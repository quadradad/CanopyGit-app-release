import { BranchIcon } from '../icons';

interface FreshRepoCTAProps {
  branchCount: number;
}

export function FreshRepoCTA({ branchCount }: FreshRepoCTAProps) {
  if (branchCount > 1) return null;

  return (
    <div className="bg-bg-surface-raised border border-border-default rounded-lg p-4 flex items-start gap-3">
      <BranchIcon size={20} className="text-text-tertiary shrink-0 mt-0.5" />
      <p className="text-sm text-text-secondary">
        Start branching off main to unlock Canopy&apos;s full power.
      </p>
    </div>
  );
}
