import { useState } from 'react';
import type { BranchTreeNode } from '../../../shared/types';
import { useBranch } from '../../contexts/BranchContext';
import { ChevronIcon } from '../icons';
import { BranchRow } from './BranchRow';

interface UntrackedSectionProps {
  branches: BranchTreeNode[];
}

export function UntrackedSection({ branches }: UntrackedSectionProps) {
  const { selectedBranch, selectBranch, records } = useBranch();
  const [isExpanded, setIsExpanded] = useState(branches.length > 0);

  if (branches.length === 0) return null;

  return (
    <div className="border-t border-border-default">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1.5 w-full px-3 py-2.5 text-xs font-medium text-text-tertiary hover:text-text-secondary transition-colors uppercase tracking-wider"
      >
        <ChevronIcon
          size={10}
          className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
        />
        Untracked ({branches.length})
      </button>

      <div
        className={`overflow-hidden transition-[max-height] duration-200 ease-in-out ${
          isExpanded ? 'max-h-[2000px]' : 'max-h-0'
        }`}
      >
        {branches.map((node, idx) => (
          <BranchRow
            key={node.branch.name}
            node={{ ...node, depth: 0 }}
            record={records.get(node.branch.name)}
            isSelected={selectedBranch === node.branch.name}
            onSelect={selectBranch}
            parentDepths={[]}
            isLast={idx === branches.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
