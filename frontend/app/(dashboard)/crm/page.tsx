"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getDashboardKpis, getPipelineFunnel, getTasksSummary } from "@/services/crm-api";
import { KpiCards } from "@/components/crm/KpiCards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardBreadcrumb from "@/components/layout/dashboard-breadcrumb";
import dynamic from "next/dynamic";
import type { CrmKpis, PipelineFunnel } from "@/types/crm";

// ApexCharts só pode ser carregado no cliente (sem SSR)
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface TasksSummary {
  pending: number;
  overdue: number;
  done_today: number;
}

export default function CrmDashboardPage() {
  const [kpis, setKpis] = useState<CrmKpis | null>(null);
  const [funnel, setFunnel] = useState<PipelineFunnel[]>([]);
  const [tasksSummary, setTasksSummary] = useState<TasksSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([getDashboardKpis(), getPipelineFunnel(), getTasksSummary()])
      .then(([k, f, t]) => {
        setKpis(k);
        setFunnel(Array.isArray(f) ? f : []);
        setTasksSummary(t as TasksSummary);
      })
      .catch(() => {
        toast.error("Erro ao carregar dados do dashboard");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <DashboardBreadcrumb items={[{ label: "CRM" }, { label: "Dashboard" }]} />

      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Dashboard CRM</h1>

        {/* KPI Cards */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : kpis ? (
          <KpiCards kpis={kpis} />
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Funil de Pipeline */}
          <Card>
            <CardHeader>
              <CardTitle>Funil de Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-56 w-full" />
              ) : funnel.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">
                  Nenhum dado de funil disponível.
                </p>
              ) : (
                <Chart
                  type="bar"
                  height={250}
                  options={{
                    chart: { toolbar: { show: false } },
                    xaxis: { categories: funnel.map((s) => s.stage_name) },
                    colors: funnel.map((s) => s.stage_color),
                    plotOptions: { bar: { horizontal: true } },
                    dataLabels: { enabled: true },
                  }}
                  series={[{ name: "Contatos", data: funnel.map((s) => s.count) }]}
                />
              )}
            </CardContent>
          </Card>

          {/* Resumo de Tarefas */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo de Tarefas</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : !tasksSummary ? (
                <p className="text-sm text-muted-foreground text-center py-10">
                  Nenhum dado disponível.
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                    <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Pendentes</span>
                    <span className="font-bold text-yellow-700 dark:text-yellow-400">{tasksSummary.pending ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                    <span className="text-sm font-medium text-red-700 dark:text-red-400">Atrasadas</span>
                    <span className="font-bold text-red-700 dark:text-red-400">{tasksSummary.overdue ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">Concluídas hoje</span>
                    <span className="font-bold text-green-700 dark:text-green-400">{tasksSummary.done_today ?? 0}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
