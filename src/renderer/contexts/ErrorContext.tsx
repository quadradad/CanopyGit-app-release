import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

interface Toast {
  id: number;
  message: string;
}

interface ErrorContextValue {
  toasts: Toast[];
  criticalError: string | null;
  showToast: (message: string) => void;
  setCriticalError: (message: string | null) => void;
  dismissToast: (id: number) => void;
}

const ErrorContext = createContext<ErrorContextValue | null>(null);

export function ErrorProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [criticalError, setCriticalError] = useState<string | null>(null);
  const nextIdRef = useRef(0);

  const showToast = useCallback((message: string) => {
    const id = nextIdRef.current++;
    setToasts((prev) => [...prev, { id, message }]);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ErrorContext.Provider
      value={{ toasts, criticalError, showToast, setCriticalError, dismissToast }}
    >
      {children}
    </ErrorContext.Provider>
  );
}

export function useError(): ErrorContextValue {
  const ctx = useContext(ErrorContext);
  if (!ctx) throw new Error('useError must be used within an ErrorProvider');
  return ctx;
}
