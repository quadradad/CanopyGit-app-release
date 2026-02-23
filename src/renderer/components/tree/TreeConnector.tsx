interface TreeConnectorProps {
  depth: number;
  isLast: boolean;
  parentDepths: number[];
}

export function TreeConnector({ depth, isLast, parentDepths }: TreeConnectorProps) {
  if (depth === 0) return null;

  const segments: React.ReactNode[] = [];

  // Render vertical continuation lines for each ancestor depth
  for (let i = 0; i < depth - 1; i++) {
    const hasLine = parentDepths.includes(i);
    segments.push(
      <span
        key={i}
        className={`inline-block w-5 h-full ${hasLine ? 'border-l border-border-subtle' : ''}`}
      />
    );
  }

  // Render the elbow or tee connector at the current depth
  segments.push(
    <span
      key={depth - 1}
      className={`inline-block w-5 h-full ${
        isLast
          ? 'border-l border-b border-border-subtle rounded-bl-sm'
          : 'border-l border-b border-border-subtle'
      }`}
      style={{ height: '50%', alignSelf: 'flex-end' }}
    />
  );

  return (
    <span className="inline-flex items-stretch shrink-0" style={{ width: depth * 20 }}>
      {segments}
    </span>
  );
}
