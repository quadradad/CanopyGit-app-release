interface StepIndicatorProps {
  currentStep: number;
  steps: string[];
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-0">
      {steps.map((label, i) => {
        const step = i + 1;
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;

        return (
          <div key={label} className="flex items-center">
            {i > 0 && (
              <div
                className={`w-12 h-px ${isCompleted ? 'bg-accent' : 'bg-border-default'}`}
              />
            )}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                  isCompleted
                    ? 'bg-accent text-white'
                    : isActive
                      ? 'bg-accent text-white'
                      : 'border border-border-default text-text-tertiary'
                }`}
              >
                {isCompleted ? '✓' : step}
              </div>
              <span className="text-[10px] text-text-tertiary whitespace-nowrap uppercase tracking-wider">
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
