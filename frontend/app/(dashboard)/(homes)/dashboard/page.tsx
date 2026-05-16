import DashboardBreadcrumb from "@/components/layout/dashboard-breadcrumb";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Painel | Shift Partido",
  description: "Painel principal da plataforma de gestão do diretório.",
};

export default function DashboardPage() {
  return (
    <>
      <DashboardBreadcrumb title="Painel" text="Painel" />
      <div className="mt-6 text-sm text-neutral-600 dark:text-neutral-300">
        Painel em construção.
      </div>
    </>
  );
}
