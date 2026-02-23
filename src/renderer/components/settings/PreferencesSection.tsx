import { useState, useEffect } from 'react';
import type { AppSettings } from '../../../shared/types';
import {
  APP_GET_SETTINGS,
  APP_SAVE_SETTINGS,
  DEFAULT_STALENESS_THRESHOLD_DAYS,
} from '../../../shared/constants';
import { invoke } from '../../lib/api';

export function PreferencesSection() {
  const [threshold, setThreshold] = useState(DEFAULT_STALENESS_THRESHOLD_DAYS);

  useEffect(() => {
    async function load() {
      const result = await invoke<AppSettings>(APP_GET_SETTINGS);
      if (result.ok) {
        setThreshold(result.data.stalenessThresholdDays);
      }
    }
    void load();
  }, []);

  const handleChange = (value: number) => {
    const clamped = Math.max(1, Math.min(365, value));
    setThreshold(clamped);
    void invoke(APP_SAVE_SETTINGS, {
      settings: { stalenessThresholdDays: clamped },
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm text-text-secondary">
          Show staleness warning after
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={threshold}
            onChange={(e) => handleChange(parseInt(e.target.value, 10) || DEFAULT_STALENESS_THRESHOLD_DAYS)}
            min={1}
            max={365}
            className="w-20 px-3 py-1.5 text-sm bg-bg-input border border-border-default rounded-md text-text-primary text-center focus:outline-none focus:border-accent transition-colors"
          />
          <span className="text-sm text-text-secondary">days of inactivity</span>
        </div>
      </div>
    </div>
  );
}
