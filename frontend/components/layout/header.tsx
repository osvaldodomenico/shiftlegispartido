"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarTrigger } from "../ui/sidebar";
import { NotificationBell } from "@/components/crm/NotificationBell";

const pageTitles: Record<string, string> = {
  "/dashboard": "Painel operacional",
  "/company": "Dados institucionais",
  "/calendar": "Agenda e calendário",
  "/email": "Comunicação interna",
  "/view-profile": "Perfil do usuário",
  "/finance/transactions/new": "Nova transação",
  "/finance/approvals": "Aprovações financeiras",
  "/auth/login": "Acesso ao sistema",
  // CRM
  "/crm": "CRM — Dashboard",
  "/crm/contacts": "CRM — Contatos",
  "/crm/pipeline": "CRM — Pipeline",
  "/crm/tasks": "CRM — Tarefas",
  "/crm/events": "CRM — Eventos",
  "/crm/import": "CRM — Importação",
  "/crm/settings/pipeline": "CRM — Configurações de Pipeline",
  "/crm/settings/tags": "CRM — Configurações de Tags",
  // Electoral
  "/electoral/elections": "Electoral — Eleições",
  "/electoral/campaigns": "Electoral — Campanhas",
  // Partido
  "/party/chapters": "Partido — Diretórios",
  "/party/organs": "Partido — Órgãos",
  // Mandatos
  "/mandates": "Mandatos",
};

const Header = () => {
  const pathname = usePathname();
  const pageTitle = pageTitles[pathname] ?? "Shift Partido";

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 px-4 py-4 backdrop-blur-sm dark:border-slate-700 dark:bg-[#273142]/95 md:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="-ms-1 h-10 w-10 rounded-xl border border-neutral-200 bg-white text-neutral-700 shadow-none hover:bg-neutral-100 dark:border-slate-600 dark:bg-slate-800 dark:text-neutral-100 dark:hover:bg-slate-700" />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-500 dark:text-neutral-300">
              Shift Partido
            </p>
            <h1 className="text-base font-semibold text-neutral-900 dark:text-white md:text-lg">
              {pageTitle}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/view-profile"
              className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 dark:border-slate-600 dark:text-neutral-100 dark:hover:bg-slate-800"
            >
              Perfil
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
