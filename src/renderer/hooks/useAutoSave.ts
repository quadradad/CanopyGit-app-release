import { useCallback, useEffect, useRef, useState } from 'react';
import { AUTO_SAVE_DEBOUNCE_MS } from '../../shared/constants';

interface UseAutoSaveOptions {
  debounceMs?: number;
}

interface UseAutoSaveReturn {
  isSaving: boolean;
  lastSaved: Date | null;
  triggerSave: () => void;
}

export function useAutoSave(
  value: string,
  onSave: (value: string) => Promise<void>,
  options?: UseAutoSaveOptions
): UseAutoSaveReturn {
  const debounceMs = options?.debounceMs ?? AUTO_SAVE_DEBOUNCE_MS;
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const lastSavedValueRef = useRef(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  const doSave = useCallback(
    async (val: string) => {
      if (val === lastSavedValueRef.current && lastSaved !== null) return;
      setIsSaving(true);
      try {
        await onSaveRef.current(val);
        lastSavedValueRef.current = val;
        setLastSaved(new Date());
      } finally {
        setIsSaving(false);
      }
    },
    [lastSaved]
  );

  // Debounced save on value change
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      void doSave(value);
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, debounceMs, doSave]);

  // Manual trigger for blur events
  const triggerSave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    void doSave(value);
  }, [value, doSave]);

  return { isSaving, lastSaved, triggerSave };
}
