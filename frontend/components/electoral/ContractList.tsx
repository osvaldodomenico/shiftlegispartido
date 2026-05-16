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
import { createContract } from "@/services/electoral-api";
import type { CampaignContract, ContractStatus } from "@/types/electoral";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  campaignId: string;
  contracts: CampaignContract[];
  onRefresh: () => void;
}

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

interface ContractForm {
  supplier_name: string;
  description: string;
  value: string;
  status: ContractStatus;
  signed_at: string;
}

const emptyForm: ContractForm = {
  supplier_name: "",
  description: "",
  value: "",
  status: "draft",
  signed_at: "",
};

export function ContractList({ campaignId, contracts, onRefresh }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ContractForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!form.supplier_name.trim() || !form.value) {
      toast.error("Fornecedor e valor são obrigatórios");
      return;
    }
    setSaving(true);
    try {
      await createContract(campaignId, {
        supplier: { id: "", name: form.supplier_name },
        description: form.description,
        value: Number(form.value),
        status: form.status,
        signed_at: form.signed_at || undefined,
      });
      toast.success("Contrato criado");
      setOpen(false);
      setForm(emptyForm);
      onRefresh();
    } catch {
      toast.error("Erro ao criar contrato");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-muted-foreground">
          {contracts.length} contrato(s)
        </h3>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Novo Contrato
        </Button>
      </div>

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-2 text-left font-medium">Fornecedor</th>
              <th className="px-4 py-2 text-left font-medium">Descrição</th>
              <th className="px-4 py-2 text-left font-medium">Valor</th>
              <th className="px-4 py-2 text-left font-medium">Status</th>
              <th className="px-4 py-2 text-left font-medium">Assinado em</th>
            </tr>
          </thead>
          <tbody>
            {contracts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  Nenhum contrato cadastrado
                </td>
              </tr>
            )}
            {contracts.map((c) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-2 font-medium">{c.supplier.name}</td>
                <td className="px-4 py-2 text-muted-foreground">{c.description}</td>
                <td className="px-4 py-2">R$ {c.value.toLocaleString("pt-BR")}</td>
                <td className="px-4 py-2">
                  <Badge className={STATUS_COLORS[c.status]}>{STATUS_LABELS[c.status]}</Badge>
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {c.signed_at ? new Date(c.signed_at).toLocaleDateString("pt-BR") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Contrato</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Fornecedor</Label>
              <Input
                value={form.supplier_name}
                onChange={(e) => setForm({ ...form, supplier_name: e.target.value })}
                placeholder="Nome do fornecedor"
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Objeto do contrato"
              />
            </div>
            <div>
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                placeholder="0,00"
              />
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
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data de Assinatura</Label>
              <Input
                type="date"
                value={form.signed_at}
                onChange={(e) => setForm({ ...form, signed_at: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
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
