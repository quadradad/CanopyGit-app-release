import { useState, useEffect, useCallback } from 'react';
import type { GitHubCheckTokenResponse } from '../../../shared/ipc-types';
import { GITHUB_CHECK_TOKEN } from '../../../shared/constants';
import { invoke } from '../../lib/api';
import { useGitHub } from '../../contexts/GitHubContext';
import { CloseIcon } from '../icons';
import { StepIndicator } from './StepIndicator';
import { TokenStep1 } from './TokenStep1';
import { TokenStep2 } from './TokenStep2';
import { TokenStep3 } from './TokenStep3';

interface GitHubTokenModalProps {
  onClose: () => void;
}

const STEPS = ['Create Token', 'Paste Token', 'Verify'];

export function GitHubTokenModal({ onClose }: GitHubTokenModalProps) {
  const { saveToken } = useGitHub();
  const [step, setStep] = useState(1);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenInfo, setTokenInfo] = useState<{
    login: string;
    scopes: string[];
    expiresAt: string | null;
  } | null>(null);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handleEscape]);

  const handleVerify = async (token: string) => {
    setIsVerifying(true);
    setError(null);

    try {
      await saveToken(token);

      const result = await invoke<GitHubCheckTokenResponse>(GITHUB_CHECK_TOKEN);

      if (result.ok && result.data.valid && result.data.login) {
        setTokenInfo({
          login: result.data.login,
          scopes: result.data.scopes,
          expiresAt: result.data.expiresAt,
        });
        setStep(3);
      } else {
        setError('Token is invalid or expired. Please try again.');
      }
    } catch (err) {
      const detail = err instanceof Error ? err.message : '';
      setError(detail
        ? `Failed to verify token: ${detail}`
        : 'Failed to verify token. Please check and try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-bg-surface-raised border border-border-default rounded-xl shadow-md w-[680px] max-h-[520px] overflow-y-auto">
        <div className="flex items-center justify-between px-8 py-5 border-b border-border-default">
          <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
            Connect GitHub
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded hover:bg-bg-surface-hover transition-colors text-text-tertiary hover:text-text-secondary"
          >
            <CloseIcon size={14} />
          </button>
        </div>

        <div className="px-8 py-6">
          <div className="mb-8">
            <StepIndicator currentStep={step} steps={STEPS} />
          </div>

          {step === 1 && (
            <TokenStep1 onNext={() => setStep(2)} />
          )}
          {step === 2 && (
            <TokenStep2
              onBack={() => setStep(1)}
              onVerify={(token) => void handleVerify(token)}
              isVerifying={isVerifying}
              error={error}
            />
          )}
          {step === 3 && tokenInfo && (
            <TokenStep3
              username={tokenInfo.login}
              scopes={tokenInfo.scopes}
              expiresAt={tokenInfo.expiresAt}
              onDone={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}
