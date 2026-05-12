'use client';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { ChartLineUp, Database, PencilSimple, Gear, Link as LinkIcon } from '@phosphor-icons/react';

const navItems = [
  { name: 'Analyze', href: '/analyze', icon: ChartLineUp },
  { name: 'Stock', href: '/stock', icon: Database },
  { name: 'Write', href: '/write', icon: PencilSimple },
  { name: 'URL', href: '/urls', icon: LinkIcon },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <>
      {/* ===== DESKTOP: vertical sidebar ===== */}
      <nav className="hidden md:flex w-full h-full bg-surface flex-col py-6 px-4">
        <div className="font-bold text-2xl mb-12 text-primary tracking-wider overflow-hidden whitespace-nowrap text-ellipsis">Atelier</div>

        <ul className="space-y-2 flex-1">
          {navItems.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            const Icon = item.icon;
            return (
              <li key={item.name}>
                <NextLink
                  href={item.href}
                  className={`flex items-center gap-3 p-3 transition-colors ${isActive ? 'bg-primary text-background font-bold' : 'text-secondary hover:text-primary'}`}
                >
                  <Icon weight={isActive ? 'fill' : 'duotone'} className="w-5 h-5 shrink-0" />
                  <span className="truncate whitespace-nowrap">{item.name}</span>
                </NextLink>
              </li>
            );
          })}
        </ul>

        <div className="mt-auto border-t border-border pt-4">
          <NextLink
            href="/settings"
            className={`flex items-center gap-3 p-3 transition-colors ${pathname?.startsWith('/settings') ? 'bg-primary text-background font-bold' : 'text-secondary hover:text-primary'}`}
          >
            <Gear weight={pathname?.startsWith('/settings') ? 'fill' : 'duotone'} className="w-5 h-5 shrink-0" />
            <span className="truncate whitespace-nowrap">Settings</span>
          </NextLink>
        </div>
      </nav>

      {/* ===== MOBILE: bottom tab bar ===== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border flex items-stretch">
        {navItems.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
          <NextLink
            key={item.name}
            href={item.href}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-bold transition-colors ${isActive ? 'text-primary border-t-2 border-primary' : 'text-secondary'}`}
          >
            <Icon weight={isActive ? 'fill' : 'regular'} className="w-5 h-5" />
            {item.name}
          </NextLink>
        );
        })}
        <NextLink
          href="/settings"
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-bold transition-colors ${pathname?.startsWith('/settings') ? 'text-primary border-t-2 border-primary' : 'text-secondary'}`}
        >
          <Gear weight={pathname?.startsWith('/settings') ? 'fill' : 'regular'} className="w-5 h-5" />
          Settings
        </NextLink>
      </nav>
    </>
  );
}
