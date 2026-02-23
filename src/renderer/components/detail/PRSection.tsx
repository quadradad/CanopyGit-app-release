import type { PRData } from '../../../shared/types';
import { useGitHub } from '../../contexts/GitHubContext';
import { useRepo } from '../../contexts/RepoContext';
import { PRBadge } from '../shared/PRBadge';
import { ExternalLinkIcon } from '../icons';

interface PRSectionProps {
  pr: PRData | null;
  remoteInfo: { owner: string; repo: string } | null;
}

const REVIEW_LABELS: Record<string, { label: string; classes: string }> = {
  pending: { label: 'Awaiting review', classes: 'border border-status-waiting text-status-waiting' },
  changes_requested: { label: 'Changes requested', classes: 'border border-status-blocked text-status-blocked' },
  approved: { label: 'Approved', classes: 'border border-status-ready text-status-ready' },
};

const CHECKS_DOT: Record<string, string> = {
  success: 'bg-status-ready',
  failure: 'bg-status-blocked',
  pending: 'bg-status-waiting',
};

export function PRSection({ pr }: PRSectionProps) {
  const { isConnected } = useGitHub();
  const { openSettings } = useRepo();

  // GitHub not connected
  if (!isConnected) {
    return (
      <div className="space-y-2">
        <h3 className="text-xs text-text-secondary uppercase tracking-[0.1em]">
          Pull Request
        </h3>
        <div className="text-sm text-text-tertiary">
          <button
            onClick={openSettings}
            className="text-accent hover:underline"
          >
            Connect GitHub
          </button>{' '}
          to see PR status
        </div>
      </div>
    );
  }

  // PR exists
  if (pr) {
    return (
      <div className="space-y-2">
        <h3 className="text-xs text-text-secondary uppercase tracking-[0.1em]">
          Pull Request
        </h3>
        <div className="bg-bg-surface border border-border-default rounded-lg px-5 py-4 space-y-3">
          <p className="text-sm text-text-primary font-medium truncate">
            #{pr.number} — {pr.title}
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            <PRBadge prNumber={pr.number} state={pr.state} />
            {pr.reviewState && (
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${REVIEW_LABELS[pr.reviewState]?.classes ?? 'border border-status-waiting text-status-waiting'}`}>
                {REVIEW_LABELS[pr.reviewState]?.label ?? pr.reviewState}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-text-secondary">
            {pr.checksState && (
              <span className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${CHECKS_DOT[pr.checksState] ?? 'bg-status-waiting'}`} />
                Checks {pr.checksState}
              </span>
            )}
            {pr.commentCount > 0 && (
              <span>{pr.commentCount} comment{pr.commentCount !== 1 ? 's' : ''}</span>
            )}
          </div>

          <button
            onClick={() => window.open(pr.htmlUrl, '_blank')}
            className="flex items-center gap-1 text-xs text-accent hover:underline"
          >
            View on GitHub
            <ExternalLinkIcon size={10} />
          </button>
        </div>
      </div>
    );
  }

  // No PR found
  return (
    <div className="space-y-2">
      <h3 className="text-xs text-text-secondary uppercase tracking-[0.1em]">
        Pull Request
      </h3>
      <div className="bg-bg-surface border border-border-default rounded-lg px-5 py-4">
        <p className="text-sm text-text-tertiary text-center">No PR open for this branch.</p>
      </div>
    </div>
  );
}
