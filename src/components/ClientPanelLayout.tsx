'use client';
import Navigation from '@/components/Navigation';
import ResizableLayout from '@/components/ResizableLayout';

export default function ClientPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* ===== DESKTOP: sidebar + resizable main ===== */}
      <div className="hidden md:block h-full w-full overflow-hidden">
        <ResizableLayout
          leftPanel={<Navigation />}
          rightPanel={
            <div className="flex flex-col h-full w-full overflow-hidden bg-background">
              {children}
            </div>
          }
          defaultLeftPercent={18}
          minLeftPercent={10}
          maxLeftPercent={30}
        />
      </div>

      {/* ===== MOBILE: full-width content + fixed bottom nav ===== */}
      <div className="md:hidden flex flex-col h-full w-full overflow-hidden">
        {/* Mobile header */}
        <div className="shrink-0 bg-surface border-b border-border px-4 py-3 flex items-center">
          <span className="font-bold text-primary tracking-widest text-lg">Atelier</span>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-hidden pb-16">
          {children}
        </div>

        {/* Bottom navigation */}
        <Navigation />
      </div>
    </>
  );
}
