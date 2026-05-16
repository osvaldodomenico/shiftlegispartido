"use client";

import { AppSidebar } from "@/components/app-sidebar";
import Header from "@/components/layout/header";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";

export function ClientRoot({
  defaultOpen,
  children,
}: {
  defaultOpen: boolean;
  children: ReactNode;
}) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <SidebarProvider
          defaultOpen={defaultOpen}
          className="min-h-screen bg-neutral-100 dark:bg-[#1e2734]"
        >
          <AppSidebar side="left" variant="sidebar" />
          <SidebarInset className="min-h-screen min-w-0 bg-transparent shadow-none">
            <Header />
            <main className="flex-1">
              <div className="mx-auto w-full max-w-screen-2xl px-4 py-5 md:px-6 md:py-6">
                {children}
              </div>
            </main>
          </SidebarInset>
          <Toaster position="top-center" reverseOrder={false} />
        </SidebarProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
