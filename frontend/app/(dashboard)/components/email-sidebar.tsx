"use client";

import { useEmailSidebar } from "@/contexts/email-sidebar-context";
import { cn } from "@/lib/utils";
import { Info, Mail, SendHorizontal } from "lucide-react";

const EmailSidebar = () => {
  const { isSidebarOpen } = useEmailSidebar();

  return (
    <div
      className={cn(
        "email-sidebar card absolute left-0 top-0 z-[10] h-full w-[280px] border-0 p-0 xl:static xl:w-auto",
        isSidebarOpen ? "block" : "hidden xl:block"
      )}
    >
      <div className="card-body space-y-6 p-6">
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-4 dark:border-slate-600 dark:bg-slate-800/40">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <SendHorizontal className="h-5 w-5" />
          </div>
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
            Comunicacao interna
          </h3>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-300">
            Nenhuma caixa, campanha ou fila foi configurada ainda.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-3 text-sm text-neutral-700 shadow-sm dark:bg-slate-800 dark:text-neutral-200">
            <Mail className="h-4 w-4 text-primary" />
            <span>Entrada real indisponivel</span>
          </div>
          <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Este modulo foi limpo para remover 100% dos dados ficticios do
              template. O proximo passo e integrar mensagens reais.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailSidebar;
