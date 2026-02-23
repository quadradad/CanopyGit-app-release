import type { BranchTreeNode } from '../../shared/types';

/**
 * Filters the branch tree by search query and excluded statuses.
 * Preserves parent context: if a child matches, its ancestors are kept.
 */
export function filterBranchTree(
  tree: BranchTreeNode[],
  searchQuery: string,
  excludedStatuses: Set<string>
): BranchTreeNode[] {
  const query = searchQuery.toLowerCase().trim();

  function filterNode(node: BranchTreeNode): BranchTreeNode | null {
    // Recursively filter children first
    const filteredChildren = node.children
      .map(filterNode)
      .filter((child): child is BranchTreeNode => child !== null);

    // Check if this node itself matches
    const nameMatches = query === '' || node.branch.name.toLowerCase().includes(query);
    const statusExcluded =
      excludedStatuses.size > 0 &&
      node.record?.status &&
      excludedStatuses.has(node.record.status);

    const selfMatches = nameMatches && !statusExcluded;

    // Include this node if it matches or if any children matched (parent context)
    if (selfMatches || filteredChildren.length > 0) {
      return {
        ...node,
        children: filteredChildren,
      };
    }

    return null;
  }

  return tree
    .map(filterNode)
    .filter((node): node is BranchTreeNode => node !== null);
}
