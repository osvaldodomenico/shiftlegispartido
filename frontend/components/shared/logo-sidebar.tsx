
'use client'

import { useTheme } from 'next-themes';
import Image from "next/image";
import Link from "next/link";

import { useSidebarCollapsed } from '@/hooks/useSidebarCollapsed';
import { cn } from '@/lib/utils';
import LogoIcon from '@/public/assets/images/logo-icon.png';
import LogoWhite from '@/public/assets/images/logo-light.png';
import LogoDark from '@/public/assets/images/logo.png';

function LogoSidebar() {
  const { resolvedTheme } = useTheme()
  const isCollapsed = useSidebarCollapsed();

  return (
    <Link
      href="/dashboard"
      className={cn(
        'sidebar-logo h-[72px] py-3.5 flex items-center justify-center border-b border-neutral-100 dark:border-slate-700',
        isCollapsed ? 'px-1' : 'px-4'
      )}
    >
      <Image
        src={
          isCollapsed
            ? LogoIcon
            : resolvedTheme === 'dark'
              ? LogoWhite
              : LogoDark
        }
        alt="Shift Partido"
        width={isCollapsed ? 44 : 168}
        height={40}
        priority
      />
    </Link>
  )
}

export default LogoSidebar
