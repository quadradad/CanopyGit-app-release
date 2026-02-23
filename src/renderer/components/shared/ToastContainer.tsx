import { useError } from '../../contexts/ErrorContext';

export function ToastContainer() {
  const { toasts, dismissToast } = useError();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-start gap-2 px-4 py-3 bg-bg-surface border border-border-default rounded-lg shadow-lg text-sm text-text-secondary"
        >
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => dismissToast(toast.id)}
            className="text-text-tertiary hover:text-text-secondary shrink-0"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
