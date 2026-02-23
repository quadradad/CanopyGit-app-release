import { useState, useEffect } from 'react';
import type { AppSettings } from '../../../shared/types';
import { APP_GET_SETTINGS, APP_SAVE_SETTINGS } from '../../../shared/constants';
import { invoke } from '../../lib/api';
import { ToggleSwitch } from '../shared/ToggleSwitch';

const COOLDOWN_OPTIONS = [
  { value: 30, label: '30 seconds' },
  { value: 60, label: '60 seconds' },
  { value: 120, label: '2 minutes' },
  { value: 300, label: '5 minutes' },
];

export function SyncRefreshSection() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [cooldown, setCooldown] = useState(60);
  const [showStale, setShowStale] = useState(true);
  const [threshold, setThreshold] = useState(30);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      const result = await invoke<AppSettings>(APP_GET_SETTINGS);
      if (result.ok) {
        setAutoRefresh(result.data.autoRefreshOnFocus);
        setCooldown(result.data.refreshCooldownSeconds);
        setShowStale(result.data.showStaleWarnings);
        setThreshold(result.data.stalenessThresholdDays);
        setLoaded(true);
      }
    }
    void load();
  }, []);

  const save = (partial: Partial<AppSettings>) => {
    void invoke(APP_SAVE_SETTINGS, { settings: partial });
  };

  if (!loaded) return null;

  return (
    <div className="space-y-5">
      <ToggleSwitch
        label="Auto-refresh on focus"
        description="Refresh branches when the app gains focus"
        checked={autoRefresh}
        onChange={(v) => {
          setAutoRefresh(v);
          save({ autoRefreshOnFocus: v });
        }}
      />

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <span className="text-sm text-text-primary">Refresh cooldown</span>
          <p className="text-xs text-text-tertiary mt-0.5">Minimum time between auto-refreshes</p>
        </div>
        <select
          value={cooldown}
          onChange={(e) => {
            const val = Number(e.target.value);
            setCooldown(val);
            save({ refreshCooldownSeconds: val });
          }}
          className="bg-bg-input border border-border-default rounded-md px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
        >
          {COOLDOWN_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <ToggleSwitch
        label="Show stale branch warnings"
        description="Highlight branches with no recent activity"
        checked={showStale}
        onChange={(v) => {
          setShowStale(v);
          save({ showStaleWarnings: v });
        }}
      />

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <span className="text-sm text-text-primary">Stale threshold</span>
          <p className="text-xs text-text-tertiary mt-0.5">Days of inactivity before warning</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={threshold}
            onChange={(e) => {
              const val = Math.max(1, Math.min(365, parseInt(e.target.value, 10) || 30));
              setThreshold(val);
              save({ stalenessThresholdDays: val });
            }}
            min={1}
            max={365}
            className="w-16 px-2 py-1.5 text-sm bg-bg-input border border-border-default rounded-md text-text-primary text-center focus:outline-none focus:border-accent transition-colors"
          />
          <span className="text-sm text-text-secondary">days</span>
        </div>
      </div>
    </div>
  );
}
