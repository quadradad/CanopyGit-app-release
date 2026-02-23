import { useState } from 'react';
import { useAutoSave } from '../../hooks/useAutoSave';
import { SaveIndicator } from '../shared/SaveIndicator';

interface NextStepFieldProps {
  value: string;
  onChange: (value: string) => Promise<void>;
}

export function NextStepField({ value: initialValue, onChange }: NextStepFieldProps) {
  const [value, setValue] = useState(initialValue);
  const { isSaving, lastSaved, triggerSave } = useAutoSave(value, onChange);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-xs text-text-secondary uppercase tracking-[0.1em]">
          Next Step
        </label>
        <SaveIndicator show={lastSaved !== null && !isSaving} />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={triggerSave}
        placeholder="What's the first thing you'll do next?"
        className="w-full px-4 py-3 text-sm bg-bg-surface border border-border-default rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent transition-colors"
      />
    </div>
  );
}
