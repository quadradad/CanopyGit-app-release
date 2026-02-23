import type { BranchTreeNode } from '../../../shared/types';
import { ArrowUpIcon } from '../icons';
import { useBranch } from '../../contexts/BranchContext';

interface BranchHeaderProps {
  node: BranchTreeNode;
  totalBranches: number;
  isDefaultBranch: boolean;
}

export function BranchHeader({ node, totalBranches, isDefaultBranch }: BranchHeaderProps) {
  const { selectBranch } = useBranch();
  const { branch, parent } = node;

  return (
    <div>
      <h2 className="font-mono text-mono-lg text-text-primary truncate">
        {branch.name}
      </h2>

      {parent && (
        <p className="mt-1.5 text-sm text-text-secondary flex items-center gap-1">
          branched from{' '}
          <button
            onClick={() => selectBranch(parent)}
            className="inline-flex items-center gap-0.5 font-mono text-accent hover:underline"
          >
            <ArrowUpIcon size={12} />
            {parent}
          </button>
        </p>
      )}

      {!parent && isDefaultBranch && (
        <p className="mt-1.5 text-sm text-text-secondary">
          Root branch · {totalBranches} branch{totalBranches !== 1 ? 'es' : ''} total
        </p>
      )}
    </div>
  );
}
