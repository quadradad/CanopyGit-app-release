interface SkeletonLoaderProps {
  lines?: number;
  width?: string;
}

export function SkeletonLoader({
  lines = 3,
  width = '100%',
}: SkeletonLoaderProps) {
  return (
    <div className="space-y-2" style={{ width }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-border-default rounded animate-pulse"
          style={{
            width: i === lines - 1 ? '60%' : '100%',
          }}
        />
      ))}
    </div>
  );
}
