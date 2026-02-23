interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  warning?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  warning,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative bg-bg-surface-raised rounded-xl shadow-md p-8 max-w-sm w-full mx-4">
        <h2 className="text-lg font-semibold text-text-primary mb-2">
          {title}
        </h2>
        <p className="text-sm text-text-secondary mb-4">{message}</p>
        {warning && (
          <p className="text-sm text-error mb-4">{warning}</p>
        )}
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2.5 text-sm text-white bg-error hover:bg-error-hover rounded-md transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
