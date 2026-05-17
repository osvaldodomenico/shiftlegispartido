"use client";

import { useState, useEffect } from "react";
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
import { getCampaigns, createCampaign } from "@/services/electoral-api";
import type { Campaign, CampaignStatus } from "@/types/electoral";
import { CampaignBudgetGauge } from "@/components/electoral/CampaignBudgetGauge";
import { Plus, Eye } from "lucide-react";
import toast from "react-hot-toast";

const STATUS_LABELS: Record<CampaignStatus, string> = {
  planning: "Planejamento",
  active: "Ativa",
  finished: "Encerrada",
};

const STATUS_COLORS: Record<CampaignStatus, string> = {
  planning: "bg-yellow-100 text-yellow-700",
  active: "bg-green-100 text-green-700",
  finished: "bg-gray-100 text-gray-600",
};

interface CampaignForm {
  name: string;
  status: CampaignStatus;
  budget_limit: string;
}

const emptyForm: CampaignForm = { name: "", status: "planning", budget_limit: "" };

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CampaignForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await getCampaigns();
      setCampaigns(data.data as Campaign[]);
    } catch {
      toast.error("Erro ao carregar campanhas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Nome da campanha é obrigatório");
      return;
    }
    setSaving(true);
    try {
      await createCampaign({
        name: form.name,
        status: form.status,
        budget_limit: form.budget_limit ? Number(form.budget_limit) : undefined,
      });
      toast.success("Campanha criada");
      setOpen(false);
      setForm(emptyForm);
      load();
    } catch {
      toast.error("Erro ao criar campanha");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campanhas</h1>
          <p className="text-muted-foreground text-sm">Gestão de campanhas eleitorais</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Nova Campanha
        </Button>
      </div>

      <div className="rounded-md border bg-white dark:bg-[#273142]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Nome</th>
              <th className="px-4 py-3 text-left font-medium">Eleição</th>
              <th className="px-4 py-3 text-left font-medium">Candidato</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium min-w-[180px]">Orçamento</th>
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
            {!loading && campaigns.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhuma campanha cadastrada
                </td>
              </tr>
            )}
            {campaigns.map((c) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.election.name}</td>
                <td className="px-4 py-3">{c.candidate.name}</td>
                <td className="px-4 py-3">
                  <Badge className={STATUS_COLORS[c.status]}>{STATUS_LABELS[c.status]}</Badge>
                </td>
                <td className="px-4 py-3">
                  {c.budget_limit ? (
                    <CampaignBudgetGauge
                      spent={c.total_spent ?? 0}
                      limit={c.budget_limit}
                    />
                  ) : (
                    <span className="text-muted-foreground text-xs">Sem limite</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/electoral/campaigns/${c.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Campanha</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nome da campanha"
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v as CampaignStatus })}
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
              <Label>Limite de Orçamento (R$)</Label>
              <Input
                type="number"
                value={form.budget_limit}
                onChange={(e) => setForm({ ...form, budget_limit: e.target.value })}
                placeholder="Opcional"
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
