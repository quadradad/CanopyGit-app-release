import { useState, useRef, useEffect } from 'react';
import { useRepo } from '../contexts/RepoContext';
import { invoke } from '../lib/api';
import { APP_SELECT_FOLDER } from '../../shared/constants';
import { ChevronIcon, FolderIcon, FolderPlusIcon } from './icons';

export function RepoSwitcher() {
  const { currentRepo, repos, selectRepo, openNewRepo } = useRepo();
  const [isOpen, setIsOpen] = useState(false);
  const [folderPath, setFolderPath] = useState('');
  const [isBrowsing, setIsBrowsing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleAddRepo = () => {
    const path = folderPath.trim();
    if (!path) return;
    void openNewRepo(path);
    setFolderPath('');
    setIsOpen(false);
  };

  const handleBrowse = async () => {
    setIsBrowsing(true);
    try {
      const result = await invoke<string | null>(APP_SELECT_FOLDER);
      if (result.ok && result.data) {
        void openNewRepo(result.data);
        setFolderPath('');
        setIsOpen(false);
      }
    } finally {
      setIsBrowsing(false);
    }
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 text-sm text-text-primary hover:bg-bg-surface-hover rounded-md transition-colors"
      >
        <span className="flex items-center gap-2 font-medium truncate">
          <FolderIcon size={14} className="shrink-0 text-text-tertiary" />
          <span className={currentRepo ? 'font-mono' : ''}>
            {currentRepo?.displayName ?? 'No repository selected'}
          </span>
        </span>
        <ChevronIcon
          size={12}
          className={`ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-bg-surface-raised border border-border-default rounded-lg shadow-md z-40 overflow-hidden">
          {repos.length > 0 && (
            <>
              <p className="text-xs font-medium uppercase tracking-wider text-text-tertiary px-3 pt-3 pb-1">
                Recent
              </p>

              {repos.map((repo) => (
                <button
                  key={repo.id}
                  onClick={() => {
                    void selectRepo(repo);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 hover:bg-bg-surface-hover transition-colors flex items-start gap-2.5 ${
                    currentRepo?.id === repo.id
                      ? 'text-accent'
                      : 'text-text-primary'
                  }`}
                >
                  <FolderIcon size={14} className="shrink-0 mt-0.5 text-text-tertiary" />
                  <div className="min-w-0">
                    <span className="block font-mono text-sm font-medium truncate">
                      {repo.displayName}
                    </span>
                    <span className="block text-xs text-text-tertiary truncate">
                      {repo.path}
                    </span>
                  </div>
                </button>
              ))}
            </>
          )}

          <div className="border-t border-border-default px-3 py-2.5">
            <div className="flex gap-2">
              <input
                type="text"
                value={folderPath}
                onChange={(e) => setFolderPath(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddRepo(); }}
                placeholder="/path/to/repo"
                className="flex-1 px-2.5 py-1.5 text-sm bg-bg-input border border-border-default rounded-md text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent transition-colors font-mono"
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
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm text-accent hover:bg-bg-surface-hover rounded-md disabled:opacity-50 transition-colors"
              >
                <FolderPlusIcon size={14} />
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
