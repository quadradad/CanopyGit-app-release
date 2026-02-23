import { ExternalLinkIcon } from '../icons';

interface TokenStep1Props {
  onNext: () => void;
}

export function TokenStep1({ onNext }: TokenStep1Props) {
  const handleOpenGitHub = () => {
    window.open(
      'https://github.com/settings/tokens/new?description=Canopy&scopes=repo,read:user,read:org',
      '_blank'
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-text-primary">
          Connect Canopy to GitHub
        </h2>
        <p className="text-sm text-text-secondary">
          Canopy uses a Personal Access Token (PAT) to read PR status and review
          data. Your token is stored securely in your Mac Keychain.
        </p>
      </div>

      <ol className="space-y-4">
        <li className="flex gap-3">
          <span className="w-6 h-6 rounded-full bg-accent text-white text-xs font-medium flex items-center justify-center shrink-0">
            1
          </span>
          <div>
            <p className="text-sm text-text-primary">Navigate to GitHub token settings</p>
            <button
              onClick={handleOpenGitHub}
              className="inline-flex items-center gap-1 text-sm text-accent hover:underline mt-1"
            >
              Open GitHub token settings
              <ExternalLinkIcon size={12} />
            </button>
          </div>
        </li>
        <li className="flex gap-3">
          <span className="w-6 h-6 rounded-full bg-accent text-white text-xs font-medium flex items-center justify-center shrink-0">
            2
          </span>
          <div>
            <p className="text-sm text-text-primary">Select these scopes:</p>
            <div className="flex flex-wrap gap-2 mt-1">
              <code className="px-2 py-0.5 text-xs bg-bg-input rounded border border-border-default text-text-secondary">repo</code>
              <code className="px-2 py-0.5 text-xs bg-bg-input rounded border border-border-default text-text-secondary">read:user</code>
              <code className="px-2 py-0.5 text-xs bg-bg-input rounded border border-border-default text-text-secondary">read:org</code>
            </div>
          </div>
        </li>
        <li className="flex gap-3">
          <span className="w-6 h-6 rounded-full bg-accent text-white text-xs font-medium flex items-center justify-center shrink-0">
            3
          </span>
          <p className="text-sm text-text-primary">Generate and copy the token</p>
        </li>
      </ol>

      <div className="border-l-4 border-accent bg-bg-surface-raised rounded-r-md p-3">
        <p className="text-xs text-text-secondary">
          We recommend setting a 90-day expiration. Canopy will remind you before it expires.
        </p>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onNext}
          className="px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-hover rounded-md transition-colors"
        >
          I have my token →
        </button>
      </div>
    </div>
  );
}
