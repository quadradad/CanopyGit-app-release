import { useState } from 'react';
import { useGitHub } from '../../contexts/GitHubContext';
import { GitHubIcon } from '../icons';
import { GitHubTokenModal } from './GitHubTokenModal';

export function GitHubTokenSection() {
  const { isConnected, username, clearToken, checkConnection } = useGitHub();
  const [showModal, setShowModal] = useState(false);

  const handleDisconnect = async () => {
    await clearToken();
  };

  const handleVerify = async () => {
    await checkConnection();
  };

  return (
    <>
      <div className="space-y-3">
        {isConnected ? (
          <>
            <div className="flex items-center gap-3">
              <GitHubIcon size={20} className="text-text-secondary" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-sm text-success">
                    <span className="w-2 h-2 rounded-full bg-success" />
                    Connected
                  </span>
                  <span className="text-sm text-text-secondary">
                    as <span className="font-medium text-text-primary">@{username}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => void handleVerify()}
                className="px-3 py-1.5 text-xs text-text-secondary border border-border-default rounded-md hover:bg-bg-surface-hover transition-colors"
              >
                Verify
              </button>
              <button
                onClick={() => void handleDisconnect()}
                className="px-3 py-1.5 text-xs text-error border border-error/30 rounded-md hover:bg-error/10 transition-colors"
              >
                Disconnect
              </button>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="text-xs text-accent hover:underline"
            >
              Replace token…
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <GitHubIcon size={20} className="text-text-tertiary" />
              <p className="text-sm text-text-secondary">Not connected</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-hover rounded-md transition-colors"
            >
              Connect
            </button>
          </>
        )}
      </div>

      {showModal && (
        <GitHubTokenModal onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
