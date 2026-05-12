'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { ArrowLeft } from '@phosphor-icons/react';

interface ResizableLayoutProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  defaultLeftPercent?: number;
  minLeftPercent?: number;
  maxLeftPercent?: number;
  handleColor?: string;
  mobileShowRight?: boolean;
  onMobileBack?: () => void;
  mobileBackLabel?: string;
}

export default function ResizableLayout({
  leftPanel,
  rightPanel,
  defaultLeftPercent = 28,
  minLeftPercent = 12,
  maxLeftPercent = 50,
  handleColor = 'var(--border)',
  mobileShowRight = false,
  onMobileBack,
  mobileBackLabel = '戻る',
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

  const onMouseUp = useCallback(() => setIsDragging(false), []);

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
    <>
      {/* ===== MOBILE ===== */}
      <div className="flex flex-col h-full w-full md:hidden overflow-hidden">
        {mobileShowRight ? (
          <div className="flex flex-col h-full w-full">
            {onMobileBack && (
              <div className="shrink-0 border-b border-border bg-surface px-4 py-3 flex items-center gap-2">
                <button
                  onClick={onMobileBack}
                  className="flex items-center gap-1 text-sm text-secondary hover:text-primary transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {mobileBackLabel}
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              {rightPanel}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {leftPanel}
          </div>
        )}
      </div>

      {/* ===== DESKTOP ===== */}
      <div
        ref={containerRef}
        className="hidden md:flex h-full w-full overflow-hidden"
        style={{ userSelect: isDragging ? 'none' : 'auto' }}
      >
        <div className="flex flex-col h-full overflow-hidden shrink-0" style={{ width: `${leftPercent}%` }}>
          {leftPanel}
        </div>
        <div
          onMouseDown={onMouseDown}
          className="shrink-0 w-1 h-full cursor-col-resize transition-colors"
          style={{ backgroundColor: 'var(--border)' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = handleColor; }}
          onMouseLeave={(e) => { if (!isDragging) e.currentTarget.style.backgroundColor = 'var(--border)'; }}
        />
        <div className="flex flex-col h-full overflow-hidden" style={{ width: `${100 - leftPercent}%` }}>
          {rightPanel}
        </div>
      </div>
    </>
  );
}
