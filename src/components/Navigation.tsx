'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChartLineUp, Database, PencilSimple, Gear } from '@phosphor-icons/react';

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Analyze', href: '/analyze', icon: ChartLineUp },
    { name: 'Stock', href: '/stock', icon: Database },
    { name: 'Write', href: '/write', icon: PencilSimple },
  ];

  return (
    <nav className="w-full h-full bg-surface flex flex-col py-6 px-4">
      <div className="font-bold text-2xl mb-12 text-primary tracking-wider overflow-hidden whitespace-nowrap text-ellipsis">Atelier</div>
      
      <ul className="space-y-2 flex-1">
        {navItems.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.name}>
              <Link 
                href={item.href} 
                className={`flex items-center gap-3 p-3 transition-colors ${
                  isActive 
                    ? 'bg-primary text-background font-bold' 
                    : 'text-secondary hover:text-primary'
                }`}
              >
                <Icon weight={isActive ? "fill" : "duotone"} className="w-5 h-5 shrink-0" />
                <span className="truncate whitespace-nowrap">{item.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-auto border-t border-border pt-4">
        <Link 
          href="/settings" 
          className={`flex items-center gap-3 p-3 transition-colors ${
            pathname?.startsWith('/settings') 
              ? 'bg-primary text-background font-bold' 
              : 'text-secondary hover:text-primary'
          }`}
        >
          <Gear weight={pathname?.startsWith('/settings') ? "fill" : "duotone"} className="w-5 h-5 shrink-0" />
          <span className="truncate whitespace-nowrap">Settings</span>
        </Link>
      </div>
    </nav>
  );
}
