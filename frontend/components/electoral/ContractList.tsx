"use client";

import { useState } from "react";
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
import { createContract, updateContract, deleteContract } from "@/services/electoral-api";
import type { CampaignContract, ContractStatus } from "@/types/electoral";
import { Plus, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}
function formatDate(str?: string) {
  if (!str) return "—";
  return new Date(str).toLocaleDateString("pt-BR");
}

// ─── Labels ───────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<ContractStatus, string> = {
  draft: "Rascunho",
  active: "Ativo",
  finished: "Encerrado",
  cancelled: "Cancelado",
};

const STATUS_COLORS: Record<ContractStatus, string> = {
  draft: "bg-gray-100 text-gray-600",
  active: "bg-green-100 text-green-700",
  finished: "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-700",
};

// ─── Form ─────────────────────────────────────────────────────────────────────

interface ContractForm {
  supplier_name: string;
  supplier_document: string;
  description: string;
  value: string;
  status: ContractStatus;
  signed_at: string;
  invoice_number: string;
}

const emptyForm: ContractForm = {
  supplier_name: "",
  supplier_document: "",
  description: "",
  value: "",
  status: "draft",
  signed_at: "",
  invoice_number: "",
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  campaignId: string;
  contracts: CampaignContract[];
  onRefresh: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ContractList({ campaignId, contracts, onRefresh }: Props) {
  const [open, setOpen] = useState(false);
  const [editContract, setEditContract] = useState<CampaignContract | null>(null);
  const [form, setForm] = useState<ContractForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function openAdd() {
    setEditContract(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(c: CampaignContract) {
    setEditContract(c);
    setForm({
      supplier_name: c.supplier?.name ?? "",
      supplier_document: c.supplier_document ?? "",
      description: c.description ?? "",
      value: String(c.value),
      status: c.status,
      signed_at: c.signed_at ? c.signed_at.slice(0, 10) : "",
      invoice_number: c.invoice_number ?? "",
    });
    setOpen(true);
  }

  async function handleSave() {
    if (!form.supplier_name.trim() || !form.value) {
      toast.error("Fornecedor e valor são obrigatórios");
      return;
    }
    setSaving(true);
    try {
      const payload: Partial<CampaignContract> = {
        supplier: { id: editContract?.supplier?.id ?? "", name: form.supplier_name },
        supplier_document: form.supplier_document || undefined,
        description: form.description,
        value: Number(form.value),
        status: form.status,
        signed_at: form.signed_at || undefined,
        invoice_number: form.invoice_number || undefined,
      };
      if (editContract) {
        await updateContract(campaignId, editContract.id, payload);
        toast.success("Contrato atualizado");
      } else {
        await createContract(campaignId, payload);
        toast.success("Contrato criado");
      }
      setOpen(false);
      setForm(emptyForm);
      onRefresh();
    } catch {
      toast.error("Erro ao salvar contrato");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(contractId: string) {
    if (!confirm("Deseja excluir este contrato?")) return;
    setDeletingId(contractId);
    try {
      await deleteContract(campaignId, contractId);
      toast.success("Contrato excluído");
      onRefresh();
    } catch {
      toast.error("Erro ao excluir contrato");
    } finally {
      setDeletingId(null);
    }
  }

  const total = contracts.reduce((s, c) => s + (c.value ?? 0), 0);

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b">
        <p className="text-sm text-muted-foreground">
          {contracts.length} contrato(s) · Total: {formatBRL(total)}
        </p>
        <Button size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4 mr-1" />
          Novo Contrato
        </Button>
      </div>

      {/* Table */}
      {contracts.length === 0 ? (
        <div className="px-6 py-12 text-center text-muted-foreground text-sm">
          Nenhum contrato cadastrado
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Fornecedor</th>
              <th className="px-4 py-3 text-left font-medium">CNPJ/CPF</th>
              <th className="px-4 py-3 text-left font-medium">Descrição</th>
              <th className="px-4 py-3 text-left font-medium">Assinatura</th>
              <th className="px-4 py-3 text-left font-medium">NF / Doc.</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Valor</th>
              <th className="px-4 py-3 text-left font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((c) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{c.supplier?.name ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                  {c.supplier_document ?? "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                  {c.description || "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {formatDate(c.signed_at)}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {c.invoice_number ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge className={STATUS_COLORS[c.status]}>
                    {STATUS_LABELS[c.status]}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right font-semibold">
                  {formatBRL(c.value)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openEdit(c)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(c.id)}
                      disabled={deletingId === c.id}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            <tr className="bg-muted/30 font-semibold">
              <td colSpan={6} className="px-4 py-2 text-right text-sm">Total</td>
              <td className="px-4 py-2 text-right">{formatBRL(total)}</td>
              <td />
            </tr>
          </tbody>
        </table>
      )}

      {/* Add / Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editContract ? "Editar Contrato" : "Novo Contrato"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Fornecedor</Label>
                <Input
                  value={form.supplier_name}
                  onChange={(e) => setForm({ ...form, supplier_name: e.target.value })}
                  placeholder="Nome do fornecedor"
                />
              </div>
              <div>
                <Label>CNPJ / CPF do Fornecedor</Label>
                <Input
                  value={form.supplier_document}
                  onChange={(e) => setForm({ ...form, supplier_document: e.target.value })}
                  placeholder="00.000.000/0001-00"
                />
              </div>
              <div>
                <Label>NF / Nº do Documento</Label>
                <Input
                  value={form.invoice_number}
                  onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
                  placeholder="NF-e ou nº do contrato"
                />
              </div>
            </div>
            <div>
              <Label>Descrição do Serviço / Objeto</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descrição do objeto do contrato"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  placeholder="0,00"
                />
              </div>
              <div>
                <Label>Data de Assinatura</Label>
                <Input
                  type="date"
                  value={form.signed_at}
                  onChange={(e) => setForm({ ...form, signed_at: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v as ContractStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(STATUS_LABELS) as [ContractStatus, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
