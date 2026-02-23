interface SegmentOption {
  value: string;
  label: string;
}

interface SegmentedControlProps {
  options: SegmentOption[];
  value: string;
  onChange: (value: string) => void;
}

export function SegmentedControl({ options, value, onChange }: SegmentedControlProps) {
  return (
    <div className="inline-flex bg-bg-surface border border-border-default rounded-md overflow-hidden">
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            onClick={() => {
              if (!isActive) onChange(option.value);
            }}
            className={`px-4 py-2 text-xs font-medium transition-colors ${
              isActive
                ? 'bg-accent text-white'
                : 'text-text-secondary hover:bg-bg-surface-hover'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
