import { useEffect } from 'react';
import { useRepo } from '../../contexts/RepoContext';
import { useBranch } from '../../contexts/BranchContext';
import { useGitHub } from '../../contexts/GitHubContext';
import { EmptyState } from '../shared/EmptyState';
import { GitHubBanner } from '../shared/GitHubBanner';
import { WelcomeView } from '../WelcomeView';
import { DetailPanel } from '../detail/DetailPanel';
import { SettingsPanel } from '../settings/SettingsPanel';

export function RightPanel() {
  const { currentRepo, settingsOpen, openSettings, closeSettings } = useRepo();
  const { selectedBranch } = useBranch();
  const { isConnected, tokenCorrupted } = useGitHub();

  // Auto-close settings when a branch is selected
  useEffect(() => {
    if (selectedBranch && settingsOpen) {
      closeSettings();
    }
  }, [selectedBranch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Settings panel takes priority
  if (settingsOpen) {
    return (
      <div className="flex-1 h-full bg-bg-surface overflow-hidden">
        <SettingsPanel />
      </div>
    );
  }

  // No repo selected → Welcome
  if (!currentRepo) {
    return (
      <div className="flex-1 h-full bg-bg-surface overflow-hidden">
        <WelcomeView />
      </div>
    );
  }

  // No branch selected
  if (!selectedBranch) {
    return (
      <div className="flex-1 h-full bg-bg-surface flex flex-col items-center justify-center">
        <EmptyState message="Select a branch to view details" />
        {(!isConnected || tokenCorrupted) && (
          <div className="w-full max-w-md mt-8 px-6">
            <GitHubBanner onOpenSettings={openSettings} corrupted={tokenCorrupted} />
          </div>
        )}
      </div>
    );
  }

  // Branch selected → Detail panel
  return (
    <div className="flex-1 h-full bg-bg-surface overflow-hidden">
      <DetailPanel />
    </div>
  );
}
