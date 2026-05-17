"use client";

import { useState } from "react";
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
import { TseCodeSelect } from "./TseCodeSelect";
import { addTseReportItem } from "@/services/electoral-api";
import type { TseReportItem, TseCode, TseItemType } from "@/types/electoral";
import { Plus, Receipt, TrendingUp, TrendingDown } from "lucide-react";
import toast from "react-hot-toast";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}
function formatDate(str: string) {
  return new Date(str).toLocaleDateString("pt-BR");
}

// ─── Labels ───────────────────────────────────────────────────────────────────

const ITEM_TYPE_LABELS: Record<TseItemType, string> = {
  receita: "Receita",
  despesa: "Despesa",
};
const ITEM_TYPE_COLORS: Record<TseItemType, string> = {
  receita: "bg-green-100 text-green-700",
  despesa: "bg-red-100 text-red-700",
};

// ─── Form ─────────────────────────────────────────────────────────────────────

interface ItemForm {
  type: TseItemType;
  tse_code?: TseCode;
  description: string;
  amount: string;
  date: string;
  document: string;
  invoice_ref: string;
}
const emptyForm: ItemForm = {
  type: "despesa",
  tse_code: undefined,
  description: "",
  amount: "",
  date: "",
  document: "",
  invoice_ref: "",
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  campaignId: string;
  reportId: string;
  items: TseReportItem[];
  onRefresh: () => void;
  readOnly?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TseReportItems({ campaignId, reportId, items, onRefresh, readOnly }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ItemForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const receitas = items.filter((i) => i.type === "receita");
  const despesas = items.filter((i) => i.type === "despesa");

  async function handleSave() {
    if (!form.tse_code) {
      toast.error("Selecione o código TSE");
      return;
    }
    if (!form.amount || !form.date) {
      toast.error("Valor e data são obrigatórios");
      return;
    }
    setSaving(true);
    try {
      await addTseReportItem(campaignId, reportId, {
        type: form.type,
        tse_code: form.tse_code,
        description: form.description,
        amount: Number(form.amount),
        date: form.date,
        document: form.document || undefined,
        invoice_ref: form.invoice_ref || undefined,
      });
      toast.success("Lançamento adicionado");
      setOpen(false);
      setForm(emptyForm);
      onRefresh();
    } catch {
      toast.error("Erro ao adicionar lançamento");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Receitas */}
      <Card className="card !p-0 !block border-0 overflow-hidden">
        <CardHeader className="border-b !block border-neutral-200 dark:border-slate-600 !py-4 px-6">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Receitas ({receitas.length})
            </CardTitle>
            {!readOnly && (
              <Button
                size="sm"
                onClick={() => {
                  setForm({ ...emptyForm, type: "receita" });
                  setOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Receita
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ItemTable items={receitas} />
        </CardContent>
      </Card>

      {/* Despesas */}
      <Card className="card !p-0 !block border-0 overflow-hidden">
        <CardHeader className="border-b !block border-neutral-200 dark:border-slate-600 !py-4 px-6">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              Despesas ({despesas.length})
            </CardTitle>
            {!readOnly && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setForm({ ...emptyForm, type: "despesa" });
                  setOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Despesa
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ItemTable items={despesas} />
        </CardContent>
      </Card>

      {/* Add item dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Novo Lançamento — {ITEM_TYPE_LABELS[form.type]}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v as TseItemType, tse_code: undefined })}
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
            <div>
              <Label>Código TSE</Label>
              <TseCodeSelect
                value={form.tse_code}
                filterType={form.type}
                onChange={(code) => setForm({ ...form, tse_code: code })}
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descrição do lançamento"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0,00"
                />
              </div>
              <div>
                <Label>Data</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>CNPJ / CPF do Fornecedor</Label>
                <Input
                  value={form.document}
                  onChange={(e) => setForm({ ...form, document: e.target.value })}
                  placeholder="00.000.000/0001-00"
                />
              </div>
              <div>
                <Label>Nota Fiscal / Comprovante</Label>
                <Input
                  value={form.invoice_ref}
                  onChange={(e) => setForm({ ...form, invoice_ref: e.target.value })}
                  placeholder="NF-e ou número do recibo"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Salvando..." : "Adicionar Lançamento"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Item Table ───────────────────────────────────────────────────────────────

function ItemTable({ items }: { items: TseReportItem[] }) {
  if (items.length === 0) {
    return (
      <div className="px-6 py-8 text-center text-muted-foreground text-sm">
        <Receipt className="h-8 w-8 mx-auto mb-2 opacity-30" />
        Nenhum lançamento
      </div>
    );
  }
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b bg-muted/50">
          <th className="px-4 py-3 text-left font-medium">Cód. TSE</th>
          <th className="px-4 py-3 text-left font-medium">Descrição</th>
          <th className="px-4 py-3 text-left font-medium">Data</th>
          <th className="px-4 py-3 text-left font-medium">Fornecedor</th>
          <th className="px-4 py-3 text-left font-medium">NF/Comprovante</th>
          <th className="px-4 py-3 text-right font-medium">Valor</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30">
            <td className="px-4 py-3 whitespace-nowrap">
              <Badge variant="outline" className="font-mono text-xs">
                {item.tse_code?.code ?? "—"}
              </Badge>
            </td>
            <td className="px-4 py-3">
              <p className="font-medium">{item.description || item.tse_code?.description || "—"}</p>
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
              {formatDate(item.date)}
            </td>
            <td className="px-4 py-3 text-muted-foreground text-xs">
              {item.document ?? "—"}
            </td>
            <td className="px-4 py-3 text-muted-foreground text-xs">
              {item.invoice_ref ?? "—"}
            </td>
            <td className="px-4 py-3 text-right font-medium">
              {formatBRL(item.amount)}
            </td>
          </tr>
        ))}
        <tr className="bg-muted/30 font-semibold">
          <td colSpan={5} className="px-4 py-2 text-right text-sm">Total</td>
          <td className="px-4 py-2 text-right">
            {formatBRL(items.reduce((s, i) => s + i.amount, 0))}
          </td>
        </tr>
      </tbody>
    </table>
  );
}
