"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TseCodeSelect } from "./TseCodeSelect";
import { addTseReportItem } from "@/services/electoral-api";
import type { TseReportItem, TseCode } from "@/types/electoral";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  campaignId: string;
  reportId: string;
  items: TseReportItem[];
  onRefresh: () => void;
  readOnly?: boolean;
}

interface ItemForm {
  tse_code?: TseCode;
  description: string;
  amount: string;
  date: string;
}

const emptyForm: ItemForm = {
  tse_code: undefined,
  description: "",
  amount: "",
  date: "",
};

export function TseReportItems({ campaignId, reportId, items, onRefresh, readOnly }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ItemForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!form.tse_code || !form.amount || !form.date) {
      toast.error("Código TSE, valor e data são obrigatórios");
      return;
    }
    setSaving(true);
    try {
      await addTseReportItem(campaignId, reportId, {
        tse_code: form.tse_code,
        description: form.description,
        amount: Number(form.amount),
        date: form.date,
      });
      toast.success("Item adicionado");
      setOpen(false);
      setForm(emptyForm);
      onRefresh();
    } catch {
      toast.error("Erro ao adicionar item");
    } finally {
      setSaving(false);
    }
  }

  const total = items.reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">{items.length} item(s)</h3>
          {items.length > 0 && (
            <p className="text-sm font-semibold">Total: R$ {total.toLocaleString("pt-BR")}</p>
          )}
        </div>
        {!readOnly && (
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar Item
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-2 text-left font-medium">Código TSE</th>
              <th className="px-4 py-2 text-left font-medium">Descrição</th>
              <th className="px-4 py-2 text-left font-medium">Valor</th>
              <th className="px-4 py-2 text-left font-medium">Data</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                  Nenhum item no relatório
                </td>
              </tr>
            )}
            {items.map((item) => (
              <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-2">
                  <span className="font-mono text-xs">{item.tse_code.code}</span>{" "}
                  <span className="text-muted-foreground">{item.tse_code.description}</span>
                </td>
                <td className="px-4 py-2">{item.description}</td>
                <td className="px-4 py-2">R$ {item.amount.toLocaleString("pt-BR")}</td>
                <td className="px-4 py-2 text-muted-foreground">
                  {new Date(item.date).toLocaleDateString("pt-BR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Item TSE</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Código TSE</Label>
              <TseCodeSelect
                value={form.tse_code}
                onChange={(code) => setForm({ ...form, tse_code: code })}
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descrição do item"
              />
            </div>
            <div>
              <Label>Valor (R$)</Label>
              <Input
                type="number"
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
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Salvando..." : "Adicionar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
