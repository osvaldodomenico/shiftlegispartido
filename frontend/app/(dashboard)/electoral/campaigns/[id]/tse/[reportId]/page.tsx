"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { getTseReport, getTseReportItems, submitTseReport } from "@/services/electoral-api";
import type { TseReport, TseReportItem, TseReportType, TseReportStatus } from "@/types/electoral";
import { TseReportItems } from "@/components/electoral/TseReportItems";
import { ArrowLeft, Send } from "lucide-react";
import toast from "react-hot-toast";

const TYPE_LABELS: Record<TseReportType, string> = { receita: "Receita", despesa: "Despesa" };

const STATUS_LABELS: Record<TseReportStatus, string> = {
  draft: "Rascunho",
  submitted: "Enviado",
  accepted: "Aceito",
  rejected: "Rejeitado",
};

const STATUS_COLORS: Record<TseReportStatus, string> = {
  draft: "bg-gray-100 text-gray-600",
  submitted: "bg-blue-100 text-blue-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default function TseReportDetailPage() {
  const { id, reportId } = useParams<{ id: string; reportId: string }>();
  const [report, setReport] = useState<TseReport | null>(null);
  const [items, setItems] = useState<TseReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const loadReport = useCallback(async () => {
    try {
      const data = await getTseReport(id, reportId);
      setReport(data.data as TseReport);
    } catch {
      toast.error("Erro ao carregar relatório");
    }
  }, [id, reportId]);

  const loadItems = useCallback(async () => {
    try {
      const data = await getTseReportItems(id, reportId);
      setItems(data.data as TseReportItem[]);
    } catch {
      toast.error("Erro ao carregar itens do relatório");
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
      toast.success("Relatório enviado ao TSE com sucesso");
      setConfirmOpen(false);
      loadReport();
    } catch {
      toast.error("Erro ao enviar relatório ao TSE");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="p-6 text-center text-muted-foreground">Carregando...</div>;
  }

  if (!report) {
    return <div className="p-6 text-center text-muted-foreground">Relatório não encontrado</div>;
  }

  const isDraft = report.status === "draft";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/electoral/campaigns/${id}/tse`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                Relatório TSE — {TYPE_LABELS[report.type]}
              </h1>
              <Badge className={STATUS_COLORS[report.status]}>
                {STATUS_LABELS[report.status]}
              </Badge>
              {report.is_final && (
                <Badge className="bg-purple-100 text-purple-700">Final</Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm">
              Período: {new Date(report.period_start).toLocaleDateString("pt-BR")} a{" "}
              {new Date(report.period_end).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>

        {isDraft && (
          <Button onClick={() => setConfirmOpen(true)} disabled={submitting}>
            <Send className="h-4 w-4 mr-2" />
            Enviar ao TSE
          </Button>
        )}
      </div>

      {/* Report metadata */}
      <div className="rounded-lg border bg-white dark:bg-[#273142] p-6">
        <h2 className="text-base font-semibold mb-4">Informações do Relatório</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Tipo</p>
            <Badge className="bg-indigo-100 text-indigo-700">{TYPE_LABELS[report.type]}</Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Status</p>
            <Badge className={STATUS_COLORS[report.status]}>{STATUS_LABELS[report.status]}</Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Relatório</p>
            <p className="font-medium">{report.is_final ? "Final" : "Parcial"}</p>
          </div>
          {report.submitted_at && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Enviado em</p>
              <p className="font-medium">
                {new Date(report.submitted_at).toLocaleDateString("pt-BR")}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="rounded-lg border bg-white dark:bg-[#273142] p-6">
        <h2 className="text-base font-semibold mb-4">Itens do Relatório</h2>
        <TseReportItems
          campaignId={id}
          reportId={reportId}
          items={items}
          onRefresh={loadItems}
          readOnly={!isDraft}
        />
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar envio ao TSE</DialogTitle>
            <DialogDescription>
              Esta ação irá enviar o relatório ao TSE e não poderá ser desfeita. O relatório
              passará para o status &ldquo;Enviado&rdquo; e não poderá mais ser editado. Deseja
              continuar?
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
