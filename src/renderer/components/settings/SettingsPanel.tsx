import { useEffect } from 'react';
import { useRepo } from '../../contexts/RepoContext';
import { ArrowLeftIcon, ExternalLinkIcon } from '../icons';
import { GitHubTokenSection } from './GitHubTokenSection';
import { RecentReposSection } from './RecentReposSection';
import { SyncRefreshSection } from './SyncRefreshSection';
import { AppearanceSection } from './AppearanceSection';
import { DataPrivacySection } from './DataPrivacySection';

function SectionHeader({ children }: { children: string }) {
  return (
    <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-4">
      {children}
    </h3>
  );
}

function AboutSection() {
  const handleViewOnGitHub = () => {
    window.open('https://github.com/VistaInspect-James/git-branch-tracker', '_blank');
  };

  return (
    <div>
      <SectionHeader>About</SectionHeader>
      <div className="space-y-2">
        <p className="text-sm text-text-primary">Canopy v0.1.0</p>
        <button
          onClick={handleViewOnGitHub}
          className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
        >
          View on GitHub
          <ExternalLinkIcon size={12} />
        </button>
        <p className="text-xs text-text-tertiary">Built with React, Express, and TypeScript</p>
      </div>
    </div>
  );
}

export function SettingsPanel() {
  const { closeSettings } = useRepo();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeSettings();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeSettings]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-8 py-5 border-b border-border-default">
        <button
          onClick={closeSettings}
          aria-label="Back to branch detail"
          className="p-1 rounded hover:bg-bg-surface-hover transition-colors"
        >
          <ArrowLeftIcon size={16} />
        </button>
        <h2 className="text-lg font-medium text-text-primary">Settings</h2>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* GitHub Connection */}
        <div className="px-8 py-6 border-b border-border-default">
          <SectionHeader>GitHub Connection</SectionHeader>
          <GitHubTokenSection />
        </div>

        {/* Recent Repositories */}
        <div className="px-8 py-6 border-b border-border-default">
          <SectionHeader>Recent Repositories</SectionHeader>
          <RecentReposSection />
        </div>

        {/* Sync & Refresh */}
        <div className="px-8 py-6 border-b border-border-default">
          <SectionHeader>Sync & Refresh</SectionHeader>
          <SyncRefreshSection />
        </div>

        {/* Appearance */}
        <div className="px-8 py-6 border-b border-border-default">
          <SectionHeader>Appearance</SectionHeader>
          <AppearanceSection />
        </div>

        {/* Data & Privacy */}
        <div className="px-8 py-6 border-b border-border-default">
          <SectionHeader>Data & Privacy</SectionHeader>
          <DataPrivacySection />
        </div>

        {/* About */}
        <div className="px-8 py-6">
          <AboutSection />
        </div>
      </div>
    </div>
  );
}
