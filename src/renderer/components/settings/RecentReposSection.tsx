import { useState } from 'react';
import { useRepo } from '../../contexts/RepoContext';
import { DB_REMOVE_REPO, APP_SELECT_FOLDER } from '../../../shared/constants';
import { invoke } from '../../lib/api';
import { FolderIcon, FolderPlusIcon } from '../icons';

export function RecentReposSection() {
  const { repos, openNewRepo } = useRepo();
  const [folderPath, setFolderPath] = useState('');
  const [isBrowsing, setIsBrowsing] = useState(false);

  const handleRemove = async (repoId: number) => {
    await invoke(DB_REMOVE_REPO, { repoId });
    window.location.reload();
  };

  const handleAddRepo = () => {
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

  if (repos.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-text-tertiary">No repositories added yet.</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={folderPath}
            onChange={(e) => setFolderPath(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddRepo(); }}
            placeholder="/path/to/your/repo"
            className="flex-1 px-3 py-1.5 text-sm bg-bg-input border border-border-default rounded-md text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent transition-colors font-mono"
          />
          <button
            onClick={() => void handleBrowse()}
            disabled={isBrowsing}
            aria-label="Browse for folder"
            className="inline-flex items-center px-2 py-1.5 text-sm text-text-secondary hover:text-accent hover:bg-bg-surface-hover rounded-md disabled:opacity-50 transition-colors"
          >
            <FolderIcon size={14} />
          </button>
          <button
            onClick={handleAddRepo}
            disabled={!folderPath.trim()}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-accent border border-border-default rounded-md hover:bg-bg-surface-hover disabled:opacity-50 transition-colors"
          >
            <FolderPlusIcon size={14} />
            Add
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {repos.map((repo) => (
        <div
          key={repo.id}
          className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-bg-surface-hover group transition-colors"
        >
          <FolderIcon size={14} className="text-text-tertiary shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="block font-mono text-sm text-text-primary truncate">
              {repo.displayName}
            </span>
            <span className="block text-xs text-text-tertiary truncate">
              {repo.path}
            </span>
          </div>
          <button
            onClick={() => void handleRemove(repo.id)}
            className="text-xs text-error opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          >
            Remove
          </button>
        </div>
      ))}

      <div className="flex gap-2 mt-2">
        <input
          type="text"
          value={folderPath}
          onChange={(e) => setFolderPath(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAddRepo(); }}
          placeholder="/path/to/your/repo"
          className="flex-1 px-3 py-1.5 text-sm bg-bg-input border border-border-default rounded-md text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent transition-colors font-mono"
        />
        <button
          onClick={() => void handleBrowse()}
          disabled={isBrowsing}
          aria-label="Browse for folder"
          className="inline-flex items-center px-2 py-1.5 text-sm text-text-secondary hover:text-accent hover:bg-bg-surface-hover rounded-md disabled:opacity-50 transition-colors"
        >
          <FolderIcon size={14} />
        </button>
        <button
          onClick={handleAddRepo}
          disabled={!folderPath.trim()}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-accent border border-border-default rounded-md hover:bg-bg-surface-hover disabled:opacity-50 transition-colors"
        >
          <FolderPlusIcon size={14} />
          Add
        </button>
      </div>
    </div>
  );
}
