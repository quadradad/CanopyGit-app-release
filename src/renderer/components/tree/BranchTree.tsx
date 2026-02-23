import { useCallback, useRef, useEffect, useState } from 'react';
import type { BranchTreeNode, BranchRecord, AppSettings, BranchNameFontSize } from '../../../shared/types';
import { APP_GET_SETTINGS } from '../../../shared/constants';
import { invoke } from '../../lib/api';
import { useBranch } from '../../contexts/BranchContext';
import { filterBranchTree } from '../../lib/branch-filter';
import { BranchRow } from './BranchRow';

function flattenTree(nodes: BranchTreeNode[]): string[] {
  const result: string[] = [];
  for (const node of nodes) {
    result.push(node.branch.name);
    result.push(...flattenTree(node.children));
  }
  return result;
}

interface TreeNodeListProps {
  nodes: BranchTreeNode[];
  records: Map<string, BranchRecord>;
  selectedBranch: string | null;
  onSelect: (name: string) => void;
  parentDepths: number[];
  showBranchPathInFull: boolean;
  showCommitCountBadges: boolean;
  branchNameFontSize: BranchNameFontSize;
}

function TreeNodeList({ nodes, records, selectedBranch, onSelect, parentDepths, showBranchPathInFull, showCommitCountBadges, branchNameFontSize }: TreeNodeListProps) {
  return (
    <>
      {nodes.map((node, idx) => {
        const isLast = idx === nodes.length - 1;
        const childParentDepths = isLast
          ? parentDepths
          : [...parentDepths, node.depth];

        return (
          <div key={node.branch.name} role="group">
            <BranchRow
              node={node}
              record={records.get(node.branch.name)}
              isSelected={selectedBranch === node.branch.name}
              onSelect={onSelect}
              parentDepths={parentDepths}
              isLast={isLast}
              showBranchPathInFull={showBranchPathInFull}
              showCommitCountBadges={showCommitCountBadges}
              branchNameFontSize={branchNameFontSize}
            />
            {node.children.length > 0 && (
              <TreeNodeList
                nodes={node.children}
                records={records}
                selectedBranch={selectedBranch}
                onSelect={onSelect}
                parentDepths={childParentDepths}
                showBranchPathInFull={showBranchPathInFull}
                showCommitCountBadges={showCommitCountBadges}
                branchNameFontSize={branchNameFontSize}
              />
            )}
          </div>
        );
      })}
    </>
  );
}

export function BranchTree() {
  const { tree, records, selectedBranch, selectBranch, searchQuery, activeFilters } = useBranch();
  const containerRef = useRef<HTMLDivElement>(null);
  const [showBranchPathInFull, setShowBranchPathInFull] = useState(true);
  const [showCommitCountBadges, setShowCommitCountBadges] = useState(true);
  const [branchNameFontSize, setBranchNameFontSize] = useState<BranchNameFontSize>('md');

  // Load display settings
  useEffect(() => {
    async function loadSettings() {
      const result = await invoke<AppSettings>(APP_GET_SETTINGS);
      if (result.ok) {
        setShowBranchPathInFull(result.data.showBranchPathInFull);
        setShowCommitCountBadges(result.data.showCommitCountBadges);
        setBranchNameFontSize(result.data.branchNameFontSize);
      }
    }
    void loadSettings();
  }, []);

  // Apply filters
  const excludedStatuses = new Set<string>();
  if (activeFilters.size > 0) {
    const allStatuses = [
      'active',
      'waiting_on_pr',
      'waiting_on_person',
      'blocked_by_issue',
      'ready_to_merge',
      'stale',
      'abandoned',
    ];
    for (const s of allStatuses) {
      if (!activeFilters.has(s)) {
        excludedStatuses.add(s);
      }
    }
  }

  const filteredTree = filterBranchTree(tree, searchQuery, excludedStatuses);

  // Flatten for keyboard navigation
  const flatNames = flattenTree(filteredTree);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      e.preventDefault();

      const currentIdx = selectedBranch ? flatNames.indexOf(selectedBranch) : -1;

      if (e.key === 'ArrowDown') {
        const nextIdx = currentIdx < flatNames.length - 1 ? currentIdx + 1 : 0;
        selectBranch(flatNames[nextIdx]);
      } else {
        const prevIdx = currentIdx > 0 ? currentIdx - 1 : flatNames.length - 1;
        selectBranch(flatNames[prevIdx]);
      }
    },
    [flatNames, selectedBranch, selectBranch]
  );

  // Focus container for keyboard events
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  if (filteredTree.length === 0) {
    return (
      <div className="px-3 py-6 text-center text-sm text-text-tertiary">
        {searchQuery ? 'No branches match your search' : 'No branches to display'}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      role="tree"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="outline-none"
    >
      <TreeNodeList
        nodes={filteredTree}
        records={records}
        selectedBranch={selectedBranch}
        onSelect={selectBranch}
        parentDepths={[]}
        showBranchPathInFull={showBranchPathInFull}
        showCommitCountBadges={showCommitCountBadges}
        branchNameFontSize={branchNameFontSize}
      />
    </div>
  );
}
