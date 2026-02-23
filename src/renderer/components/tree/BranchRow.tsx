import type { BranchTreeNode, BranchRecord, BranchNameFontSize } from '../../../shared/types';
import { DEFAULT_STALENESS_THRESHOLD_DAYS } from '../../../shared/constants';
import { StatusBadge } from '../shared/StatusBadge';
import { PRBadge } from '../shared/PRBadge';
import { Tooltip } from '../shared/Tooltip';
import { StaleIcon, DirtyIcon, BranchIcon } from '../icons';
import { TreeConnector } from './TreeConnector';

interface BranchRowProps {
  node: BranchTreeNode;
  record?: BranchRecord | null;
  isSelected: boolean;
  onSelect: (branchName: string) => void;
  parentDepths: number[];
  isLast: boolean;
  showBranchPathInFull?: boolean;
  showCommitCountBadges?: boolean;
  branchNameFontSize?: BranchNameFontSize;
}

const FONT_SIZE_CLASSES: Record<BranchNameFontSize, string> = {
  sm: 'text-[11px]',
  md: 'text-xs',
  lg: 'text-sm',
};

function getLeafName(branchName: string): string {
  const parts = branchName.split('/');
  return parts[parts.length - 1];
}

function isStale(lastCommitDate: string): boolean {
  const commitDate = new Date(lastCommitDate);
  const now = new Date();
  const diffMs = now.getTime() - commitDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays > DEFAULT_STALENESS_THRESHOLD_DAYS;
}

export function BranchRow({
  node,
  record: recordProp,
  isSelected,
  onSelect,
  parentDepths,
  isLast,
  showBranchPathInFull = true,
  showCommitCountBadges = true,
  branchNameFontSize = 'md',
}: BranchRowProps) {
  const { branch, pr, syncStatus, depth } = node;
  const record = recordProp ?? node.record;
  const isCurrent = branch.isCurrent;
  const isDirty = isCurrent && (syncStatus?.isDirty ?? false);
  const stale = isStale(branch.lastCommitDate);
  const displayName = showBranchPathInFull ? branch.name : getLeafName(branch.name);
  const fontSizeClass = FONT_SIZE_CLASSES[branchNameFontSize];

  const rowClasses = [
    'flex items-center gap-1.5 px-2 py-2 rounded cursor-pointer transition-colors text-sm',
    isSelected ? 'bg-bg-surface-active border-l-[3px] border-accent' : 'hover:bg-bg-surface-hover border-l-[3px] border-transparent',
    '',
  ].join(' ');

  const ahead = syncStatus?.ahead ?? 0;
  const behind = syncStatus?.behind ?? 0;

  return (
    <div
      className={rowClasses}
      onClick={() => onSelect(branch.name)}
      role="treeitem"
      aria-selected={isSelected}
    >
      <TreeConnector depth={depth} isLast={isLast} parentDepths={parentDepths} />

      <Tooltip content={branch.name}>
        <span
          className={`font-mono ${fontSizeClass} flex-1 min-w-0 truncate ${
            isSelected || isCurrent ? 'font-medium text-text-primary' : 'text-text-secondary'
          }`}
        >
          {displayName}
        </span>
      </Tooltip>

      <span className="shrink-0 flex items-center gap-1">
        {isCurrent && (
          <span className="inline-flex items-center gap-0.5 text-2xs font-medium text-accent">
            <BranchIcon size={10} />
            HEAD
          </span>
        )}

        {record && <StatusBadge status={record.status} size="sm" />}

        {pr && <PRBadge prNumber={pr.number} state={pr.state} />}

        {showCommitCountBadges && (ahead > 0 || behind > 0) && (
          <span className="text-[10px] font-mono text-text-tertiary">
            {ahead > 0 && <span className="text-success">+{ahead}</span>}
            {ahead > 0 && behind > 0 && '/'}
            {behind > 0 && <span className="text-warning">-{behind}</span>}
          </span>
        )}

        {stale && (
          <StaleIcon size={12} className="shrink-0 text-text-tertiary" />
        )}

        {isDirty && (
          <DirtyIcon size={8} className="shrink-0 text-warning" />
        )}
      </span>
    </div>
  );
}
