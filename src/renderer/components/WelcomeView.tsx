import { useState } from 'react';
import { useRepo } from '../contexts/RepoContext';
import { useGitHub } from '../contexts/GitHubContext';
import { invoke } from '../lib/api';
import { APP_SELECT_FOLDER } from '../../shared/constants';
import { CanopyLogo } from './shared/CanopyLogo';
import { GitHubBanner } from './shared/GitHubBanner';
import { FolderIcon } from './icons';

export function WelcomeView() {
  const { openNewRepo, openSettings } = useRepo();
  const { isConnected, tokenCorrupted } = useGitHub();
  const [folderPath, setFolderPath] = useState('');

  const [isBrowsing, setIsBrowsing] = useState(false);

  const handleOpen = () => {
    const path = folderPath.trim();
    if (!path) return;
    void openNewRepo(path);
    setFolderPath('');
  };

  const handleBrowse = async () => {
    setIsBrowsing(true);
    try {
      const result = await invoke<string | null>(APP_SELECT_FOLDER);
      if (result.ok && result.data) {
        void openNewRepo(result.data);
        setFolderPath('');
      }
    } finally {
      setIsBrowsing(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-6">
        <CanopyLogo size="md" />

        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-text-primary">
            Welcome to Canopy
          </h1>
          <p className="text-md text-text-secondary">
            Open a Git repository to get started.
          </p>
        </div>

        <div className="flex gap-2 w-full max-w-md">
          <input
            type="text"
            value={folderPath}
            onChange={(e) => setFolderPath(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleOpen(); }}
            placeholder="/path/to/your/repo"
            className="flex-1 px-4 py-3 text-sm bg-bg-input border border-border-default rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent transition-colors font-mono"
          />
          <button
            onClick={() => void handleBrowse()}
            disabled={isBrowsing}
            aria-label="Browse for folder"
            className="inline-flex items-center px-3 py-3 text-sm text-text-secondary hover:text-accent hover:bg-bg-surface-hover rounded-lg disabled:opacity-50 transition-colors"
          >
            <FolderIcon size={16} />
          </button>
          <button
            onClick={handleOpen}
            disabled={!folderPath.trim()}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-accent hover:bg-accent-hover rounded-lg transition-colors disabled:opacity-50"
          >
            <FolderIcon size={16} />
            Open Repository...
          </button>
        </div>

        <p className="text-xs text-text-tertiary max-w-sm">
          Canopy reads your local branches and connects to GitHub for PR status.
        </p>
      </div>

      {(!isConnected || tokenCorrupted) && (
        <div className="px-8 pb-6">
          <GitHubBanner onOpenSettings={openSettings} corrupted={tokenCorrupted} />
        </div>
      )}
    </div>
  );
}
