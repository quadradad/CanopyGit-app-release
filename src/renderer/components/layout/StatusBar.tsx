import { useRefresh } from '../../contexts/RefreshContext';
import { useRelativeTime } from '../../hooks/useRelativeTime';
import { RefreshIcon } from '../icons';

export function StatusBar() {
  const { isRefreshing, lastRefreshedAt, refresh } = useRefresh();
  const lastRefreshedText = useRelativeTime(
    lastRefreshedAt?.toISOString() ?? null
  );

  return (
    <div className="flex items-center justify-between px-4 py-1.5 bg-bg-surface border-t border-border-default text-xs text-text-secondary">
      <span>
        {lastRefreshedText ? `Updated ${lastRefreshedText}` : 'Not yet refreshed'}
      </span>
      <button
        onClick={() => void refresh()}
        disabled={isRefreshing}
        className="p-1 rounded hover:bg-bg-surface-hover transition-colors disabled:opacity-50"
        title="Refresh"
      >
        <RefreshIcon
          size={14}
          className={isRefreshing ? 'animate-spin' : ''}
        />
      </button>
    </div>
  );
}
