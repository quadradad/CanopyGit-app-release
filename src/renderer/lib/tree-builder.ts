import type {
  GitBranch,
  BranchRecord,
  PRCacheEntry,
  GitSyncStatus,
  BranchTreeNode,
} from '../../shared/types';
import { MAX_TREE_DEPTH } from '../../shared/constants';

interface TreeBuilderInput {
  branches: GitBranch[];
  records: BranchRecord[];
  mergeBases: Record<string, string>; // branchName → merge-base SHA with root
  prCache: Record<string, PRCacheEntry>;
  statuses: Record<string, GitSyncStatus>;
  defaultBranch: string;
}

interface TreeBuilderOutput {
  tree: BranchTreeNode[];
  untracked: BranchTreeNode[];
}

export function buildBranchTree(input: TreeBuilderInput): TreeBuilderOutput {
  const { branches, records, mergeBases, prCache, statuses, defaultBranch } =
    input;

  if (branches.length === 0) return { tree: [], untracked: [] };

  const recordMap = new Map(records.map((r) => [r.branchName, r]));

  function makeNode(
    branch: GitBranch,
    parentName: string | null,
    depth: number
  ): BranchTreeNode {
    return {
      branch,
      record: recordMap.get(branch.name) ?? null,
      pr: prCache[branch.name]
        ? {
            number: prCache[branch.name].prNumber,
            title: prCache[branch.name].title,
            state: prCache[branch.name].state,
            reviewState: prCache[branch.name].reviewState,
            checksState: prCache[branch.name].checksState,
            commentCount: prCache[branch.name].commentCount,
            htmlUrl: prCache[branch.name].htmlUrl,
            headBranch: branch.name,
          }
        : null,
      parent: parentName,
      children: [],
      depth,
      syncStatus: statuses[branch.name] ?? null,
    };
  }

  // Find the root branch
  const rootBranch = branches.find((b) => b.name === defaultBranch);
  if (!rootBranch) {
    // No default branch found — everything is untracked
    return {
      tree: [],
      untracked: branches.map((b) => makeNode(b, null, 0)),
    };
  }

  // Separate root from other branches
  const nonRootBranches = branches.filter((b) => b.name !== defaultBranch);

  // Build parent mapping
  const parentMap = new Map<string, string>(); // child → parent
  const untracked: GitBranch[] = [];

  for (const branch of nonRootBranches) {
    const record = recordMap.get(branch.name);

    // 1. Manual parent takes absolute priority
    if (record?.manuallySetParent) {
      const parentExists = branches.some(
        (b) => b.name === record.manuallySetParent
      );
      if (parentExists) {
        parentMap.set(branch.name, record.manuallySetParent);
        continue;
      }
    }

    // 2. Use merge-base to assign to root initially (refined below)
    const mergeBase = mergeBases[branch.name];
    if (mergeBase) {
      parentMap.set(branch.name, defaultBranch);
    } else {
      untracked.push(branch);
    }
  }

  // 3. Path-prefix nesting: re-parent branches under longest matching prefix
  // e.g., "feat/auth/signup" → parent is "feat/auth" if it exists
  const trackedNames = new Set(
    [...parentMap.keys(), defaultBranch]
  );

  for (const [childName, currentParent] of parentMap) {
    // Skip branches with manual parents (already correctly assigned above)
    const record = recordMap.get(childName);
    if (record?.manuallySetParent) continue;

    // Find the longest branch name that is a path-prefix of this branch
    let bestMatch: string | null = null;
    let bestLen = 0;

    for (const candidateName of trackedNames) {
      if (candidateName === childName) continue;
      // Check if candidate + "/" is a prefix of this branch name
      const prefix = candidateName + '/';
      if (childName.startsWith(prefix) && candidateName.length > bestLen) {
        bestMatch = candidateName;
        bestLen = candidateName.length;
      }
    }

    if (bestMatch && bestMatch !== currentParent) {
      parentMap.set(childName, bestMatch);
    }
  }

  // Build the tree recursively
  function buildChildren(
    parentName: string,
    depth: number
  ): BranchTreeNode[] {
    if (depth >= MAX_TREE_DEPTH) return [];

    const children: BranchTreeNode[] = [];
    for (const [childName, parent] of parentMap) {
      if (parent === parentName) {
        const branch = branches.find((b) => b.name === childName);
        if (!branch) continue;

        const node = makeNode(branch, parentName, depth);
        node.children = buildChildren(childName, depth + 1);
        children.push(node);
      }
    }
    return children;
  }

  const rootNode = makeNode(rootBranch, null, 0);
  rootNode.children = buildChildren(defaultBranch, 1);

  const untrackedNodes = untracked.map((b) => makeNode(b, null, 0));

  return { tree: [rootNode], untracked: untrackedNodes };
}
