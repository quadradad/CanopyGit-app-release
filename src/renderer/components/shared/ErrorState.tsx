interface ErrorStateProps {
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function ErrorState({ message, action }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center">
      <p className="text-lg text-text-primary font-medium mb-2">Something went wrong</p>
      <p className="text-sm text-text-secondary mb-6 max-w-md">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-hover rounded-lg transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
