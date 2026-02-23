import { useBranch } from '../../contexts/BranchContext';
import { useRefresh } from '../../contexts/RefreshContext';
import { useRepo } from '../../contexts/RepoContext';
import { useRelativeTime } from '../../hooks/useRelativeTime';
import { CanopyLogo } from '../shared/CanopyLogo';
import { RepoSwitcher } from '../RepoSwitcher';
import { SearchBar } from '../tree/SearchBar';
import { BranchTree } from '../tree/BranchTree';
import { UntrackedSection } from '../tree/UntrackedSection';
import { SkeletonLoader } from '../shared/SkeletonLoader';
import { SettingsIcon } from '../icons';
import { BranchIcon } from '../icons';

export function LeftPanel() {
  const { untrackedBranches, tree } = useBranch();
  const { isRefreshing, lastRefreshedAt } = useRefresh();
  const { currentRepo, openSettings, settingsOpen } = useRepo();
  const lastRefreshedText = useRelativeTime(
    lastRefreshedAt?.toISOString() ?? null
  );

  // Show skeleton during initial load (refreshing and never refreshed before)
  const isInitialLoad = currentRepo && isRefreshing && !lastRefreshedAt && tree.length === 0;

  return (
    <div className="flex flex-col h-full bg-bg-surface overflow-hidden">
      <div className="px-6 pt-8 pb-5 border-b border-border-default flex justify-center">
        <CanopyLogo size="sm" />
      </div>

      <div className="px-6 py-4 border-b border-border-default">
        <RepoSwitcher />
      </div>

      {currentRepo && (
        <div className="px-6 py-3 border-b border-border-default">
          <SearchBar />
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {!currentRepo ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-text-tertiary">
            <BranchIcon size={32} className="opacity-40" />
            <p className="text-sm">Branches will appear here</p>
          </div>
        ) : isInitialLoad ? (
          <div className="px-3 py-3">
            <SkeletonLoader lines={8} />
          </div>
        ) : (
          <>
            <BranchTree />
            <UntrackedSection branches={untrackedBranches} />
          </>
        )}
      </div>

      <div className="flex items-center justify-between px-6 py-4 border-t border-border-default">
        <button
          onClick={openSettings}
          aria-label="Open settings"
          className={`inline-flex items-center gap-1.5 p-1.5 rounded transition-colors ${
            settingsOpen
              ? 'bg-bg-surface-active text-accent'
              : 'text-text-tertiary hover:text-text-secondary hover:bg-bg-surface-hover'
          }`}
        >
          <SettingsIcon size={16} />
          <span className="text-xs">Settings</span>
        </button>
        <span className="text-[10px] text-text-tertiary">
          {lastRefreshedText ? `Last synced ${lastRefreshedText}` : ''}
        </span>
      </div>
    </div>
  );
}
