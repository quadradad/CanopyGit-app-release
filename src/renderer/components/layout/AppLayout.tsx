import { useState, useCallback, useRef } from 'react';
import { LeftPanel } from './LeftPanel';
import { RightPanel } from './RightPanel';

const MIN_LEFT_WIDTH = 280;
const DEFAULT_LEFT_PERCENT = 35;

export function AppLayout() {
  const [leftPercent, setLeftPercent] = useState(DEFAULT_LEFT_PERCENT);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMouseDown = useCallback(() => {
    isDragging.current = true;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      const newLeftWidth = e.clientX;

      if (newLeftWidth < MIN_LEFT_WIDTH) return;
      if (newLeftWidth > containerWidth - MIN_LEFT_WIDTH) return;

      setLeftPercent((newLeftWidth / containerWidth) * 100);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  return (
    <div className="flex flex-col h-screen bg-bg-app text-text-primary">
      <div
        ref={containerRef}
        className="flex flex-1 overflow-hidden"
      >
        {/* Left Panel */}
        <div style={{ width: `${leftPercent}%` }} className="flex-shrink-0">
          <LeftPanel />
        </div>

        {/* Draggable Divider */}
        <div
          className="w-px bg-border-default cursor-col-resize hover:bg-accent/50 transition-colors flex-shrink-0"
          onMouseDown={handleMouseDown}
        />

        {/* Right Panel */}
        <div className="flex-1 min-w-0">
          <RightPanel />
        </div>
      </div>
    </div>
  );
}
