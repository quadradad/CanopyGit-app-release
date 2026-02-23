import { useState } from 'react';
import { GitHubIcon, CloseIcon } from '../icons';

interface GitHubBannerProps {
  onOpenSettings: () => void;
  corrupted?: boolean;
}

export function GitHubBanner({ onOpenSettings, corrupted = false }: GitHubBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className={`border-l-4 ${corrupted ? 'border-error' : 'border-warning'} bg-bg-surface-raised rounded-lg shadow-md p-4 flex items-start gap-3`}>
      <GitHubIcon size={18} className="text-text-secondary shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary">
          {corrupted
            ? 'Your GitHub token could not be read. Please re-enter it.'
            : 'Connect GitHub to enable PR features.'}
        </p>
        <button
          onClick={onOpenSettings}
          className="text-sm text-accent hover:underline mt-1"
        >
          {corrupted ? '→ Re-enter token in Settings' : '→ Add token in Settings'}
        </button>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-text-tertiary hover:text-text-secondary shrink-0"
        aria-label="Dismiss"
      >
        <CloseIcon size={14} />
      </button>
    </div>
  );
}
