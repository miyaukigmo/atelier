'use client';
import ResizableLayout from '@/components/ResizableLayout';
import Navigation from '@/components/Navigation';

export default function ClientPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <ResizableLayout
      leftPanel={<Navigation />}
      rightPanel={<div className="flex flex-col h-full w-full overflow-hidden bg-background">{children}</div>}
      defaultLeftPercent={18}
      minLeftPercent={10}
      maxLeftPercent={30}
    />
  );
}
