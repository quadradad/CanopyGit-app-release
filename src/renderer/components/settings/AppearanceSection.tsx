import { useState, useEffect } from 'react';
import type { AppSettings, BranchNameFontSize } from '../../../shared/types';
import { APP_GET_SETTINGS, APP_SAVE_SETTINGS } from '../../../shared/constants';
import { invoke } from '../../lib/api';
import { ToggleSwitch } from '../shared/ToggleSwitch';
import { SegmentedControl } from '../shared/SegmentedControl';

const FONT_SIZE_OPTIONS = [
  { value: 'sm', label: 'S' },
  { value: 'md', label: 'M' },
  { value: 'lg', label: 'L' },
];

export function AppearanceSection() {
  const [showFullPath, setShowFullPath] = useState(false);
  const [showBadges, setShowBadges] = useState(true);
  const [fontSize, setFontSize] = useState<BranchNameFontSize>('md');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      const result = await invoke<AppSettings>(APP_GET_SETTINGS);
      if (result.ok) {
        setShowFullPath(result.data.showBranchPathInFull);
        setShowBadges(result.data.showCommitCountBadges);
        setFontSize(result.data.branchNameFontSize);
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
        label="Show branch path in full"
        description="Display the full ref path instead of just the branch name"
        checked={showFullPath}
        onChange={(v) => {
          setShowFullPath(v);
          save({ showBranchPathInFull: v });
        }}
      />

      <ToggleSwitch
        label="Show commit count badges"
        description="Show ahead/behind counts on branches"
        checked={showBadges}
        onChange={(v) => {
          setShowBadges(v);
          save({ showCommitCountBadges: v });
        }}
      />

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <span className="text-sm text-text-primary">Branch name font size</span>
        </div>
        <SegmentedControl
          options={FONT_SIZE_OPTIONS}
          value={fontSize}
          onChange={(v) => {
            setFontSize(v as BranchNameFontSize);
            save({ branchNameFontSize: v as BranchNameFontSize });
          }}
        />
      </div>
    </div>
  );
}
