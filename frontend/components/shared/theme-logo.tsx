"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";

import LogoDark from "@/public/assets/images/logo.png";
import LogoWhite from "@/public/assets/images/logo-light.png";
import { useSidebarCollapsed } from "@/hooks/useSidebarCollapsed";

function ThemeLogo() {
  const { resolvedTheme } = useTheme();
  useSidebarCollapsed();

  return (
    <Link href="/dashboard">
      <Image
        src={resolvedTheme === "dark" ? LogoWhite : LogoDark}
        alt="Shift Partido"
        width={168}
        height={40}
        priority
      />
    </Link>
  );
}

export default ThemeLogo;
