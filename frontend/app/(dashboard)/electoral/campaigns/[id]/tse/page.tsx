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
import { getTseReports, createTseReport } from "@/services/electoral-api";
import type { TseReport, TseReportStatus } from "@/types/electoral";
import { ArrowLeft, Plus, ExternalLink, FileCheck } from "lucide-react";
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

// ─── Form ─────────────────────────────────────────────────────────────────────

interface TseForm {
  period_start: string;
  period_end: string;
  is_final: boolean;
}
const emptyForm: TseForm = { period_start: "", period_end: "", is_final: false };

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TseReportsPage() {
  const { id } = useParams<{ id: string }>();
  const [reports, setReports] = useState<TseReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<TseForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setReports(await getTseReports(id));
    } catch {
      toast.error("Erro ao carregar prestações de contas");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function handleSave() {
    if (!form.period_start || !form.period_end) {
      toast.error("Período é obrigatório");
      return;
    }
    setSaving(true);
    try {
      await createTseReport(id, {
        period_start: form.period_start,
        period_end: form.period_end,
        is_final: form.is_final,
      });
      toast.success("Prestação de contas criada");
      setOpen(false);
      setForm(emptyForm);
      load();
    } catch {
      toast.error("Erro ao criar prestação de contas");
    } finally {
      setSaving(false);
    }
  }

  // Totals
  const totalReceitas = reports.reduce((s, r) => s + (r.total_receitas ?? 0), 0);
  const totalDespesas = reports.reduce((s, r) => s + (r.total_despesas ?? 0), 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/electoral/campaigns/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Prestação de Contas TSE</h1>
            <p className="text-muted-foreground text-sm">
              Relatórios eleitorais conforme Lei nº 9.504/1997
            </p>
          </div>
        </div>
        <Button onClick={() => { setForm(emptyForm); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Prestação
        </Button>
      </div>

      {/* Totals summary */}
      {reports.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Receitas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-green-700">{formatBRL(totalReceitas)}</p>
            </CardContent>
          </Card>
          <Card className="card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Despesas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-red-700">{formatBRL(totalDespesas)}</p>
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
      )}

      {/* Reports table */}
      <Card className="card !p-0 !block border-0 overflow-hidden">
        <CardHeader className="border-b !block border-neutral-200 dark:border-slate-600 !py-4 px-6">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base font-semibold">
              Prestações de Contas ({reports.length})
            </CardTitle>
            {reports.filter((r) => r.status === "submitted").length > 0 && (
              <Badge className="bg-blue-100 text-blue-700">
                <FileCheck className="h-3.5 w-3.5 mr-1" />
                {reports.filter((r) => r.status === "submitted").length} enviado(s) ao TSE
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading && (
            <div className="px-6 py-8 text-center text-muted-foreground">Carregando...</div>
          )}
          {!loading && reports.length === 0 && (
            <div className="px-6 py-12 text-center text-muted-foreground">
              <FileCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Nenhuma prestação de contas cadastrada</p>
              <p className="text-sm mt-1">
                Crie a primeira prestação de contas para esta campanha
              </p>
            </div>
          )}
          {!loading && reports.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Período</th>
                  <th className="px-4 py-3 text-left font-medium">Tipo</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Receitas</th>
                  <th className="px-4 py-3 text-left font-medium">Despesas</th>
                  <th className="px-4 py-3 text-left font-medium">Enviado em</th>
                  <th className="px-4 py-3 text-left font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatDate(r.period_start)} — {formatDate(r.period_end)}
                    </td>
                    <td className="px-4 py-3">
                      {r.is_final ? (
                        <Badge className="bg-purple-100 text-purple-700">Final</Badge>
                      ) : (
                        <Badge className="bg-indigo-100 text-indigo-700">Parcial</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={STATUS_COLORS[r.status]}>
                        {STATUS_LABELS[r.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-green-700 font-medium">
                      {formatBRL(r.total_receitas)}
                    </td>
                    <td className="px-4 py-3 text-red-700 font-medium">
                      {formatBRL(r.total_despesas)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(r.submitted_at)}
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/electoral/campaigns/${id}/tse/${r.id}`}>
                          <ExternalLink className="h-3.5 w-3.5 mr-1" />
                          Abrir
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Create dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Prestação de Contas TSE</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Conforme a Lei nº 9.504/1997, toda campanha eleitoral deve apresentar
              prestação de contas ao TSE dentro dos prazos estabelecidos.
            </p>
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
            <div>
              <Label>Tipo de Prestação</Label>
              <Select
                value={form.is_final ? "final" : "parcial"}
                onValueChange={(v) => setForm({ ...form, is_final: v === "final" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parcial">Parcial — Prestação intermediária</SelectItem>
                  <SelectItem value="final">Final — Encerramento da campanha</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Criando..." : "Criar Prestação"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
