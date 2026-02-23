import { useState } from 'react';
import { LockIcon, CheckIcon } from '../icons';

interface TokenStep2Props {
  onBack: () => void;
  onVerify: (token: string) => void;
  isVerifying: boolean;
  error: string | null;
}

function isValidTokenFormat(token: string): boolean {
  return token.startsWith('ghp_') || token.startsWith('github_pat_');
}

export function TokenStep2({ onBack, onVerify, isVerifying, error }: TokenStep2Props) {
  const [token, setToken] = useState('');
  const isValid = isValidTokenFormat(token);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-text-primary">
          Paste your token
        </h2>
        <p className="text-sm text-text-secondary">
          Copy your token from GitHub and paste it below. It starts with{' '}
          <code className="text-text-primary">ghp_</code>.
        </p>
      </div>

      <div className="space-y-2">
        <div className="relative">
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            className="w-full px-3 py-2.5 font-mono text-sm bg-bg-input border border-border-default rounded-md text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent transition-colors pr-10"
            autoFocus
          />
          {isValid && (
            <CheckIcon size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-success" />
          )}
        </div>
        <p className="text-xs text-text-tertiary">
          Tokens start with <code>ghp_</code> (classic) or <code>github_pat_</code> (fine-grained).
        </p>
        {error && (
          <p className="text-xs text-error">{error}</p>
        )}
      </div>

      <div className="flex items-start gap-2 p-3 bg-bg-surface-raised rounded-md">
        <LockIcon size={14} className="text-text-tertiary shrink-0 mt-0.5" />
        <p className="text-xs text-text-secondary">
          Stored securely in your Mac Keychain. Canopy never sends your token to any third-party service.
        </p>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => onVerify(token)}
          disabled={!isValid || isVerifying}
          className="px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-hover rounded-md transition-colors disabled:opacity-50"
        >
          {isVerifying ? 'Verifying...' : 'Verify Connection →'}
        </button>
      </div>
    </div>
  );
}
