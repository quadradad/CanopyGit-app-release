import { LockIcon } from '../icons';

interface TokenStep3Props {
  username: string;
  scopes: string[];
  expiresAt: string | null;
  onDone: () => void;
}

export function TokenStep3({ username, scopes, expiresAt, onDone }: TokenStep3Props) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="text-4xl">✓</div>
        <h2 className="text-lg font-semibold text-text-primary">
          GitHub connected
        </h2>
      </div>

      <div className="bg-bg-surface rounded-lg p-4 space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-text-tertiary text-xs uppercase tracking-wider">Connected as</span>
          <span className="text-text-primary font-medium">@{username}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-text-tertiary text-xs uppercase tracking-wider">Token scope</span>
          <div className="flex gap-1">
            {scopes.map((scope) => (
              <code
                key={scope}
                className="px-1.5 py-0.5 text-xs bg-bg-input rounded border border-border-default text-text-secondary"
              >
                {scope}
              </code>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-text-tertiary text-xs uppercase tracking-wider">Expires</span>
          <span className="text-text-primary text-xs">
            {expiresAt ?? 'No expiration'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-text-tertiary text-xs uppercase tracking-wider">Stored</span>
          <span className="flex items-center gap-1 text-text-primary text-xs">
            <LockIcon size={12} />
            Mac Keychain ✓
          </span>
        </div>
      </div>

      <p className="text-xs text-text-tertiary text-center">
        Canopy will sync PR status and review data on each refresh.
      </p>

      <div className="flex justify-center">
        <button
          onClick={onDone}
          className="px-8 py-2.5 text-sm font-medium text-white bg-accent hover:bg-accent-hover rounded-md transition-colors"
        >
          Done — Let&apos;s go
        </button>
      </div>
    </div>
  );
}
