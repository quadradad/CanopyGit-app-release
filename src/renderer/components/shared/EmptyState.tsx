interface EmptyStateProps {
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-text-tertiary">
      <p className="text-sm mb-4">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-5 py-2.5 text-sm text-white bg-accent hover:bg-accent-hover rounded-md transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
