"use client";
import { useEffect, useState } from "react";
import { getDashboardKpis, getPipelineFunnel, getTasksSummary } from "@/services/crm-api";
import { KpiCards } from "@/components/crm/KpiCards";
import dynamic from "next/dynamic";
import type { CrmKpis, PipelineFunnel } from "@/types/crm";

// ApexCharts só pode ser carregado no cliente (sem SSR)
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function CrmDashboardPage() {
  const [kpis, setKpis] = useState<CrmKpis | null>(null);
  const [funnel, setFunnel] = useState<PipelineFunnel[]>([]);
  const [tasksSummary, setTasksSummary] = useState<any>(null);

  useEffect(() => {
    Promise.all([getDashboardKpis(), getPipelineFunnel(), getTasksSummary()]).then(
      ([k, f, t]) => {
        setKpis(k as any);
        setFunnel(f as any);
        setTasksSummary(t);
      }
    );
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard CRM</h1>

      {kpis && <KpiCards kpis={kpis} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funil de Pipeline */}
        <div className="rounded-lg border p-4">
          <h2 className="font-semibold mb-4">Funil de Pipeline</h2>
          {funnel.length > 0 && (
            <Chart
              type="bar"
              height={250}
              options={{
                chart: { toolbar: { show: false } },
                xaxis: { categories: funnel.map((f) => f.stage_name) },
                colors: funnel.map((f) => f.stage_color),
                plotOptions: { bar: { distributed: true } },
                legend: { show: false },
              }}
              series={[{ name: "Contatos", data: funnel.map((f) => f.count) }]}
            />
          )}
          {funnel.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum dado de pipeline disponível.
            </p>
          )}
        </div>

        {/* Tarefas por Status */}
        <div className="rounded-lg border p-4">
          <h2 className="font-semibold mb-4">Tarefas por Status</h2>
          {tasksSummary && (
            <Chart
              type="donut"
              height={250}
              options={{
                labels: ["Pendentes", "Em andamento", "Concluídas", "Canceladas"],
                colors: ["#f59e0b", "#3b82f6", "#22c55e", "#6b7280"],
              }}
              series={[
                tasksSummary.pending ?? 0,
                tasksSummary.in_progress ?? 0,
                tasksSummary.done ?? 0,
                tasksSummary.cancelled ?? 0,
              ]}
            />
          )}
          {!tasksSummary && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum dado de tarefas disponível.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
