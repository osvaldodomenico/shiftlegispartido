"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getTseReport, getTseReportItems, submitTseReport } from "@/services/electoral-api";
import type { TseReport, TseReportItem, TseReportStatus } from "@/types/electoral";
import { TseReportItems } from "@/components/electoral/TseReportItems";
import { ArrowLeft, Send, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBRL(value?: number) {
  if (value === undefined || value === null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}
function formatDate(str?: string) {
  if (!str) return "—";
  return new Date(str).toLocaleDateString("pt-BR");
}

// ─── Labels ───────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<TseReportStatus, string> = {
  draft: "Rascunho",
  submitted: "Enviado ao TSE",
  accepted: "Aceito pelo TSE",
  rejected: "Rejeitado pelo TSE",
};
const STATUS_COLORS: Record<TseReportStatus, string> = {
  draft: "bg-gray-100 text-gray-600",
  submitted: "bg-blue-100 text-blue-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TseReportDetailPage() {
  const { id, reportId } = useParams<{ id: string; reportId: string }>();
  const [report, setReport] = useState<TseReport | null>(null);
  const [items, setItems] = useState<TseReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const loadReport = useCallback(async () => {
    try {
      setReport(await getTseReport(id, reportId));
    } catch {
      toast.error("Erro ao carregar prestação de contas");
    }
  }, [id, reportId]);

  const loadItems = useCallback(async () => {
    try {
      setItems(await getTseReportItems(id, reportId));
    } catch {
      toast.error("Erro ao carregar lançamentos");
    }
  }, [id, reportId]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([loadReport(), loadItems()]);
      setLoading(false);
    }
    init();
  }, [loadReport, loadItems]);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await submitTseReport(id, reportId);
      toast.success("Prestação de contas enviada ao TSE");
      setConfirmOpen(false);
      loadReport();
    } catch {
      toast.error("Erro ao enviar prestação de contas ao TSE");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="p-6 text-center text-muted-foreground">Carregando...</div>;
  }
  if (!report) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Prestação de contas não encontrada
      </div>
    );
  }

  const isDraft = report.status === "draft";

  // Computed totals from items if API didn't return them
  const totalReceitas =
    report.total_receitas ??
    items.filter((i) => i.type === "receita").reduce((s, i) => s + i.amount, 0);
  const totalDespesas =
    report.total_despesas ??
    items.filter((i) => i.type === "despesa").reduce((s, i) => s + i.amount, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/electoral/campaigns/${id}/tse`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">
                Prestação de Contas TSE
              </h1>
              <Badge className={STATUS_COLORS[report.status]}>
                {STATUS_LABELS[report.status]}
              </Badge>
              {report.is_final ? (
                <Badge className="bg-purple-100 text-purple-700">Final</Badge>
              ) : (
                <Badge className="bg-indigo-100 text-indigo-700">Parcial</Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm mt-0.5">
              Período: {formatDate(report.period_start)} a {formatDate(report.period_end)}
              {report.submitted_at && ` · Enviado em ${formatDate(report.submitted_at)}`}
            </p>
          </div>
        </div>
        {isDraft && (
          <Button onClick={() => setConfirmOpen(true)}>
            <Send className="h-4 w-4 mr-2" />
            Enviar ao TSE
          </Button>
        )}
      </div>

      {/* Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Receitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-green-700">{formatBRL(totalReceitas)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {items.filter((i) => i.type === "receita").length} lançamento(s)
            </p>
          </CardContent>
        </Card>
        <Card className="card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-red-700">{formatBRL(totalDespesas)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {items.filter((i) => i.type === "despesa").length} lançamento(s)
            </p>
          </CardContent>
        </Card>
        <Card className="card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-xl font-bold ${
                totalReceitas - totalDespesas >= 0 ? "text-green-700" : "text-red-700"
              }`}
            >
              {formatBRL(totalReceitas - totalDespesas)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Items */}
      <TseReportItems
        campaignId={id}
        reportId={reportId}
        items={items}
        onRefresh={loadItems}
        readOnly={!isDraft}
      />

      {/* Confirm submit dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirmar Envio ao TSE
            </DialogTitle>
            <DialogDescription>
              Esta ação enviará a prestação de contas ao Tribunal Superior Eleitoral.
              Após o envio, não será possível realizar novos lançamentos neste relatório.
              Deseja continuar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Enviando..." : "Confirmar Envio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
