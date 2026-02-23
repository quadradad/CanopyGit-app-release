import { useState } from 'react';
import { APP_RESET_DATA } from '../../../shared/constants';
import { invoke } from '../../lib/api';
import { ExternalLinkIcon } from '../icons';

const DB_PATH = '~/Library/Application Support/Canopy/canopy.db';

export function DataPrivacySection() {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleShowInFinder = () => {
    window.open(`file://${DB_PATH.replace('~', '/Users')}`, '_blank');
  };

  const handleReset = () => {
    void invoke(APP_RESET_DATA);
  };

  return (
    <div className="space-y-6">
      {/* Database info */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-text-primary">Local database</p>
        <p className="font-mono text-xs text-text-tertiary">{DB_PATH}</p>
        <button
          onClick={handleShowInFinder}
          className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
        >
          Show in Finder
          <ExternalLinkIcon size={10} />
        </button>
      </div>

      {/* Reset */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-text-primary">Reset all Canopy data</p>
        <p className="text-xs text-text-tertiary">
          This will delete all branch notes, status data, and settings. This action cannot be undone.
        </p>
        {!showConfirm ? (
          <button
            onClick={() => setShowConfirm(true)}
            className="px-4 py-2 text-sm text-error border border-error/30 rounded-md hover:bg-error/10 transition-colors"
          >
            Reset…
          </button>
        ) : (
          <div className="p-4 bg-bg-surface-raised border border-error/30 rounded-lg space-y-3">
            <p className="text-sm font-medium text-text-primary">Are you sure?</p>
            <p className="text-xs text-text-secondary">
              This will permanently delete all branch notes, statuses, PR cache, and settings. Canopy will relaunch with a fresh state.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-white bg-error hover:bg-error/90 rounded-md transition-colors"
              >
                Reset Everything
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-sm text-text-secondary border border-border-default rounded-md hover:bg-bg-surface-hover transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
