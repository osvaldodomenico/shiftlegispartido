"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getTseReports, createTseReport, submitTseReport } from "@/services/electoral-api";
import type { TseReport, TseReportType, TseReportStatus } from "@/types/electoral";
import { ArrowLeft, Plus, Eye, Send } from "lucide-react";
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

interface ReportForm {
  type: TseReportType;
  period_start: string;
  period_end: string;
  is_final: boolean;
}

const emptyForm: ReportForm = {
  type: "receita",
  period_start: "",
  period_end: "",
  is_final: false,
};

export default function TseReportsPage() {
  const { id } = useParams<{ id: string }>();
  const [reports, setReports] = useState<TseReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ReportForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await getTseReports(id);
      setReports(data);
    } catch {
      toast.error("Erro ao carregar relatórios TSE");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function handleSave() {
    if (!form.period_start || !form.period_end) {
      toast.error("Período é obrigatório");
      return;
    }
    setSaving(true);
    try {
      await createTseReport(id, {
        type: form.type,
        period_start: form.period_start,
        period_end: form.period_end,
        is_final: form.is_final,
      });
      toast.success("Relatório criado");
      setOpen(false);
      setForm(emptyForm);
      load();
    } catch {
      toast.error("Erro ao criar relatório");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(reportId: string) {
    if (!confirm("Confirmar envio do relatório ao TSE? Esta ação não pode ser desfeita.")) return;
    setSubmittingId(reportId);
    try {
      await submitTseReport(id, reportId);
      toast.success("Relatório enviado ao TSE");
      load();
    } catch {
      toast.error("Erro ao enviar relatório");
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/electoral/campaigns/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Relatórios TSE</h1>
            <p className="text-muted-foreground text-sm">Prestação de contas eleitoral</p>
          </div>
        </div>
        <Button onClick={() => { setForm(emptyForm); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Novo Relatório
        </Button>
      </div>

      <div className="rounded-md border bg-white dark:bg-[#273142]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Período</th>
              <th className="px-4 py-3 text-left font-medium">Tipo</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Final</th>
              <th className="px-4 py-3 text-left font-medium">Enviado em</th>
              <th className="px-4 py-3 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Carregando...
                </td>
              </tr>
            )}
            {!loading && reports.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum relatório TSE
                </td>
              </tr>
            )}
            {reports.map((r) => (
              <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3">
                  {new Date(r.period_start).toLocaleDateString("pt-BR")} —{" "}
                  {new Date(r.period_end).toLocaleDateString("pt-BR")}
                </td>
                <td className="px-4 py-3">
                  <Badge className="bg-indigo-100 text-indigo-700">{TYPE_LABELS[r.type]}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge className={STATUS_COLORS[r.status]}>{STATUS_LABELS[r.status]}</Badge>
                </td>
                <td className="px-4 py-3">
                  {r.is_final ? (
                    <Badge className="bg-purple-100 text-purple-700">Final</Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">Parcial</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {r.submitted_at
                    ? new Date(r.submitted_at).toLocaleDateString("pt-BR")
                    : "—"}
                </td>
                <td className="px-4 py-3 text-right space-x-1">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/electoral/campaigns/${id}/tse/${r.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  {r.status === "draft" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSubmit(r.id)}
                      disabled={submittingId === r.id}
                      title="Enviar ao TSE"
                    >
                      <Send className="h-4 w-4 text-blue-600" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Relatório TSE</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v as TseReportType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Início do Período</Label>
                <Input
                  type="date"
                  value={form.period_start}
                  onChange={(e) => setForm({ ...form, period_start: e.target.value })}
                />
              </div>
              <div>
                <Label>Fim do Período</Label>
                <Input
                  type="date"
                  value={form.period_end}
                  onChange={(e) => setForm({ ...form, period_end: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_final"
                checked={form.is_final}
                onChange={(e) => setForm({ ...form, is_final: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="is_final">Relatório Final</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Salvando..." : "Criar Relatório"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
