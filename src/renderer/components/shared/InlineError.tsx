interface InlineErrorProps {
  message: string;
  onRetry?: () => void;
}

export function InlineError({ message, onRetry }: InlineErrorProps) {
  return (
    <div className="text-sm text-error">
      {message}
      {onRetry && (
        <>
          {' '}
          <button
            onClick={onRetry}
            className="text-accent hover:underline"
          >
            Retry
          </button>
        </>
      )}
    </div>
  );
}
