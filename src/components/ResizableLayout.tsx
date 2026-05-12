'use client';
import { useState, useRef, useCallback, useEffect } from 'react';

interface ResizableLayoutProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  defaultLeftPercent?: number;
  minLeftPercent?: number;
  maxLeftPercent?: number;
  handleColor?: string;
}

export default function ResizableLayout({
  leftPanel,
  rightPanel,
  defaultLeftPercent = 28,
  minLeftPercent = 12,
  maxLeftPercent = 50,
  handleColor = 'var(--border)',
}: ResizableLayoutProps) {
  const [leftPercent, setLeftPercent] = useState(defaultLeftPercent);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percent = (x / rect.width) * 100;
      const clamped = Math.min(Math.max(percent, minLeftPercent), maxLeftPercent);
      setLeftPercent(clamped);
    },
    [isDragging, minLeftPercent, maxLeftPercent]
  );

  const onMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, onMouseMove, onMouseUp]);

  return (
    <div
      ref={containerRef}
      className="flex h-full w-full overflow-hidden"
      style={{ userSelect: isDragging ? 'none' : 'auto' }}
    >
      {/* Left panel */}
      <div
        className="flex flex-col h-full overflow-hidden shrink-0"
        style={{ width: `${leftPercent}%` }}
      >
        {leftPanel}
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={onMouseDown}
        className="shrink-0 w-1 h-full cursor-col-resize transition-colors"
        style={{
          backgroundColor: isDragging ? handleColor : 'var(--border)',
          cursor: 'col-resize',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = handleColor; }}
        onMouseLeave={(e) => { if (!isDragging) e.currentTarget.style.backgroundColor = 'var(--border)'; }}
      />

      {/* Right panel */}
      <div
        className="flex flex-col h-full overflow-hidden"
        style={{ width: `${100 - leftPercent}%` }}
      >
        {rightPanel}
      </div>
    </div>
  );
}
