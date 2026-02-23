import { useState } from 'react';
import { useAutoSave } from '../../hooks/useAutoSave';
import { SaveIndicator } from '../shared/SaveIndicator';

interface NotesFieldProps {
  value: string;
  onChange: (value: string) => Promise<void>;
}

export function NotesField({ value: initialValue, onChange }: NotesFieldProps) {
  const [value, setValue] = useState(initialValue);
  const { isSaving, lastSaved, triggerSave } = useAutoSave(value, onChange);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-xs text-text-secondary uppercase tracking-[0.1em]">
          Notes
        </label>
        <SaveIndicator show={lastSaved !== null && !isSaving} />
      </div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={triggerSave}
        placeholder="Add context about this branch..."
        rows={5}
        className={`w-full px-4 py-3 text-sm bg-bg-surface border border-border-default rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent transition-colors resize-y min-h-[120px] ${value.trim() ? 'border-l-2 border-l-accent' : ''}`}
      />
    </div>
  );
}
