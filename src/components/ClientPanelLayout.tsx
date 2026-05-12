'use client';
import { Panel, Group, Separator } from 'react-resizable-panels';
import Navigation from '@/components/Navigation';

export default function ClientPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <Group orientation="horizontal" className="h-full w-full overflow-hidden flex">
      {/* Navigation Panel */}
      <Panel defaultSize={15} minSize={10} maxSize={25} className="flex flex-col h-full bg-surface border-r border-border">
        <Navigation />
      </Panel>

      {/* Resize Handle */}
      <Separator className="w-1 bg-border hover:bg-accent transition-colors cursor-col-resize z-10" />

      {/* Main Content Panel */}
      <Panel defaultSize={85} minSize={50} className="flex flex-col h-full bg-background overflow-hidden relative">
        {children}
      </Panel>
    </Group>
  );
}
