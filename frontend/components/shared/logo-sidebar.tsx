
'use client'

import Link from "next/link";

import { useSidebarCollapsed } from '@/hooks/useSidebarCollapsed';
import { cn } from '@/lib/utils';

function LogoSidebar() {
  const isCollapsed = useSidebarCollapsed();

  return (
    <Link
      href="/dashboard"
      className={cn(
        'sidebar-logo h-[72px] py-3.5 flex items-center justify-center border-b border-neutral-100 dark:border-slate-700',
        isCollapsed ? 'px-1' : 'px-4'
      )}
    >
      {isCollapsed ? (
        <span className="text-lg font-bold text-primary">S</span>
      ) : (
        <div className="flex flex-col items-start leading-tight">
          <span className="text-lg font-bold text-foreground tracking-wide">SHIFT LEGIS</span>
          <span className="text-xs text-muted-foreground tracking-widest uppercase">PARTIDO</span>
        </div>
      )}
    </Link>
  )
}

export default LogoSidebar
