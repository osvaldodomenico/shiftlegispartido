"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import DashboardBreadcrumb from "@/components/layout/dashboard-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  CheckSquare,
  AlertTriangle,
  CalendarDays,
  MessageSquare,
  Tag,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import api from "@/services/api";
import { getTransactions, Transaction } from "@/services/transactions.service";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

// ─── Types ──────────────────────────────────────────────────────────────────

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  order: number;
  people_count: number;
}

interface CrmDashboard {
  people: { total: number };
  tasks: { active: number; overdue: number };
  events: { upcoming_30_days: number };
  interactions: { last_7_days: number };
  tags: { total: number };
  pipeline: PipelineStage[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function KpiCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
  loading,
  badge,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bg: string;
  loading: boolean;
  badge?: { text: string; variant: "default" | "destructive" | "secondary" };
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          {badge && (
            <Badge variant={badge.variant} className="text-xs">
              {badge.text}
            </Badge>
          )}
        </div>
        <div className="mt-4 text-3xl font-bold">
          {loading ? <span className="text-muted-foreground text-xl">—</span> : value}
        </div>
        <div className="text-sm text-muted-foreground mt-1">{label}</div>
      </CardContent>
    </Card>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [crm, setCrm] = useState<CrmDashboard | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [crmRes, txns] = await Promise.all([
          api.get<{ data: CrmDashboard }>("/crm/dashboard"),
          getTransactions({ limit: 8 }),
        ]);
        setCrm(crmRes.data.data);
        setTransactions(txns);
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── KPI cards ──────────────────────────────────────────────────────────────

  const kpis = [
    {
      label: "Total de Contatos",
      value: crm?.people.total ?? 0,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950",
    },
    {
      label: "Tarefas Ativas",
      value: crm?.tasks.active ?? 0,
      icon: CheckSquare,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-950",
    },
    {
      label: "Tarefas Atrasadas",
      value: crm?.tasks.overdue ?? 0,
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50 dark:bg-red-950",
      badge:
        (crm?.tasks.overdue ?? 0) > 0
          ? { text: "Atenção", variant: "destructive" as const }
          : undefined,
    },
    {
      label: "Eventos (próx. 30 dias)",
      value: crm?.events.upcoming_30_days ?? 0,
      icon: CalendarDays,
      color: "text-purple-600",
      bg: "bg-purple-50 dark:bg-purple-950",
    },
    {
      label: "Interações (últimos 7 dias)",
      value: crm?.interactions.last_7_days ?? 0,
      icon: MessageSquare,
      color: "text-orange-600",
      bg: "bg-orange-50 dark:bg-orange-950",
    },
    {
      label: "Tags Cadastradas",
      value: crm?.tags.total ?? 0,
      icon: Tag,
      color: "text-teal-600",
      bg: "bg-teal-50 dark:bg-teal-950",
    },
  ];

  // ── Pipeline chart ──────────────────────────────────────────────────────────

  const pipelineNames = crm?.pipeline.map((s) => s.name) ?? [];
  const pipelineCounts = crm?.pipeline.map((s) => s.people_count) ?? [];
  const pipelineColors = crm?.pipeline.map((s) => s.color ?? "#6366f1") ?? ["#6366f1"];

  const pipelineOptions = {
    chart: { type: "bar" as const, toolbar: { show: false }, fontFamily: "inherit" },
    plotOptions: {
      bar: { borderRadius: 6, horizontal: false, columnWidth: "50%" },
    },
    xaxis: {
      categories: pipelineNames,
      labels: { style: { fontSize: "12px" } },
    },
    colors: pipelineColors,
    dataLabels: { enabled: true, style: { fontSize: "12px" } },
    grid: { strokeDashArray: 4, borderColor: "#e5e7eb" },
    legend: { show: false },
    tooltip: { y: { formatter: (v: number) => `${v} contato${v !== 1 ? "s" : ""}` } },
  };

  // ── Financial summary from transactions ───────────────────────────────────

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + Number(t.amount), 0);
  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + Number(t.amount), 0);

  return (
    <>
      <DashboardBreadcrumb title="Painel" text="Painel" />

      <div className="p-6 space-y-6">
        {/* ── KPI Grid ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {kpis.map((k) => (
            <KpiCard key={k.label} loading={loading} badge={(k as { badge?: { text: string; variant: "default" | "destructive" | "secondary" } }).badge} {...k} />
          ))}
        </div>

        {/* ── Charts Row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pipeline CRM */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Pipeline CRM — Contatos por etapa</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                  Carregando...
                </div>
              ) : pipelineCounts.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                  Nenhuma etapa de pipeline configurada.
                </div>
              ) : (
                <ReactApexChart
                  type="bar"
                  height={260}
                  series={[{ name: "Contatos", data: pipelineCounts }]}
                  options={pipelineOptions}
                />
              )}
            </CardContent>
          </Card>

          {/* Resumo financeiro */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Resumo Financeiro — últimas transações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Totals */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                    <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Receitas</div>
                    <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                      {loading ? "—" : formatBRL(income)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-950">
                  <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900 flex items-center justify-center">
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Despesas</div>
                    <div className="text-sm font-bold text-red-700 dark:text-red-400">
                      {loading ? "—" : formatBRL(expense)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Transaction list */}
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {loading ? (
                  <div className="text-sm text-muted-foreground">Carregando...</div>
                ) : transactions.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Nenhuma transação registrada.</div>
                ) : (
                  transactions.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between text-sm py-1.5 border-b last:border-0"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {t.type === "income" ? (
                          <TrendingUp className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <TrendingDown className="h-3.5 w-3.5 text-red-500 shrink-0" />
                        )}
                        <span className="truncate text-neutral-700 dark:text-neutral-300">
                          {t.description}
                        </span>
                      </div>
                      <span
                        className={`font-semibold shrink-0 ml-2 ${
                          t.type === "income" ? "text-emerald-600" : "text-red-500"
                        }`}
                      >
                        {t.type === "income" ? "+" : "-"}
                        {formatBRL(Number(t.amount))}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Tasks urgency row ── */}
        {!loading && (crm?.tasks.overdue ?? 0) > 0 && (
          <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <div className="font-semibold text-red-700 dark:text-red-400">
                  {crm!.tasks.overdue} tarefa{crm!.tasks.overdue !== 1 ? "s" : ""} em atraso
                </div>
                <div className="text-sm text-red-600/80 dark:text-red-400/80">
                  Acesse o CRM → Tarefas para resolver as pendências.
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
