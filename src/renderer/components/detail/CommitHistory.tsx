import { useState } from 'react';
import type { GitCommit } from '../../../shared/types';
import { useRelativeTime } from '../../hooks/useRelativeTime';
import { ChevronIcon, ExternalLinkIcon } from '../icons';

interface CommitHistoryProps {
  commits: GitCommit[];
  remoteInfo: { owner: string; repo: string } | null;
  branch: string;
  parentBranch: string | null;
  isLoading?: boolean;
}

function CommitRow({ commit, remoteInfo }: { commit: GitCommit; remoteInfo: { owner: string; repo: string } | null }) {
  const relativeTime = useRelativeTime(commit.date);
  const initial = commit.author.charAt(0).toUpperCase();
  const commitUrl = remoteInfo
    ? `https://github.com/${remoteInfo.owner}/${remoteInfo.repo}/commit/${commit.sha}`
    : null;

  return (
    <div className="flex items-start gap-3 pb-3 border-b border-border-default last:border-0">
      <span
        className="shrink-0 w-8 h-8 rounded-full bg-bg-surface-raised text-text-secondary flex items-center justify-center text-xs font-medium"
        aria-hidden="true"
      >
        {initial}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-text-primary truncate">{commit.message}</p>
        <p className="text-xs text-text-tertiary mt-0.5">
          {commit.author} · {relativeTime ?? ''} · <span className="font-mono">{commit.sha.slice(0, 7)}</span>
          {commitUrl && (
            <>
              {' · '}
              <a
                href={commitUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 text-accent hover:underline"
              >
                View
                <ExternalLinkIcon size={10} />
              </a>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export function CommitHistory({ commits, remoteInfo, branch, parentBranch, isLoading = false }: CommitHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleViewOnGitHub = () => {
    if (!remoteInfo || !parentBranch) return;
    const url = `https://github.com/${remoteInfo.owner}/${remoteInfo.repo}/compare/${parentBranch}...${branch}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        aria-label="Recent Commits"
        className="flex items-center gap-1.5 text-xs text-text-secondary uppercase tracking-[0.1em] hover:text-text-primary transition-colors"
      >
        <ChevronIcon
          size={10}
          className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
        />
        Recent Commits (Branch Only)
      </button>

      {isLoading ? (
        <p className="text-sm text-text-tertiary py-2">Loading commits...</p>
      ) : isExpanded ? (
        commits.length === 0 ? (
          <p className="text-sm text-text-tertiary py-2">No commits yet.</p>
        ) : (
          <>
            <div>
              {commits.slice(0, 10).map((commit) => (
                <CommitRow key={commit.sha} commit={commit} remoteInfo={remoteInfo} />
              ))}
            </div>

            {remoteInfo && parentBranch && (
              <button
                onClick={handleViewOnGitHub}
                className="flex items-center gap-1 text-xs text-accent hover:underline mt-2"
              >
                View all on GitHub
                <ExternalLinkIcon size={10} />
              </button>
            )}
          </>
        )
      ) : null}
    </div>
  );
}
