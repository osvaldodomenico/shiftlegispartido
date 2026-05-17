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
import { getMandates, createMandate } from "@/services/party-api";
import type { Mandate, MandateStatus } from "@/types/party";
import { Plus, Eye } from "lucide-react";
import toast from "react-hot-toast";

const STATUS_LABELS: Record<MandateStatus, string> = {
  active: "Ativo",
  inactive: "Inativo",
  suspended: "Suspenso",
};

const STATUS_COLORS: Record<MandateStatus, string> = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-600",
  suspended: "bg-red-100 text-red-700",
};

interface MandateForm {
  person_id: string;
  office: string;
  jurisdiction: string;
  start_date: string;
  end_date: string;
  status: MandateStatus | "";
}

const emptyForm: MandateForm = {
  person_id: "",
  office: "",
  jurisdiction: "",
  start_date: "",
  end_date: "",
  status: "active",
};

export default function MandatesPage() {
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<MandateForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  // Filtro por status
  const [filterStatus, setFilterStatus] = useState<MandateStatus | "all">("all");

  async function load() {
    setLoading(true);
    try {
      const data = await getMandates();
      setMandates(data);
    } catch {
      toast.error("Erro ao carregar mandatos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSave() {
    if (!form.person_id.trim() || !form.office.trim() || !form.jurisdiction.trim() || !form.start_date || !form.status) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    setSaving(true);
    try {
      await createMandate({
        person: { id: form.person_id, name: "" },
        office: form.office,
        jurisdiction: form.jurisdiction,
        start_date: form.start_date,
        end_date: form.end_date || undefined,
        status: form.status as MandateStatus,
      });
      toast.success("Mandato criado");
      setOpen(false);
      setForm(emptyForm);
      load();
    } catch {
      toast.error("Erro ao criar mandato");
    } finally {
      setSaving(false);
    }
  }

  const filtered =
    filterStatus === "all"
      ? mandates
      : mandates.filter((m) => m.status === filterStatus);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mandatos</h1>
          <p className="text-muted-foreground text-sm">
            Gestão de mandatos eletivos dos filiados
          </p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Novo Mandato
        </Button>
      </div>

      {/* Filtro de status */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "active", "inactive", "suspended"] as const).map((s) => (
          <Button
            key={s}
            variant={filterStatus === s ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus(s)}
          >
            {s === "all" ? "Todos" : STATUS_LABELS[s]}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Pessoa</th>
                <th className="text-left px-4 py-3 font-medium">Cargo</th>
                <th className="text-left px-4 py-3 font-medium">Jurisdição</th>
                <th className="text-left px-4 py-3 font-medium">Início</th>
                <th className="text-left px-4 py-3 font-medium">Fim</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum mandato encontrado.
                  </td>
                </tr>
              )}
              {filtered.map((mandate) => (
                <tr key={mandate.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link
                      href={`/people/${mandate.person.id}`}
                      className="text-primary underline-offset-4 hover:underline font-medium"
                    >
                      {mandate.person.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{mandate.office}</td>
                  <td className="px-4 py-3 text-muted-foreground">{mandate.jurisdiction}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(mandate.start_date).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {mandate.end_date
                      ? new Date(mandate.end_date).toLocaleDateString("pt-BR")
                      : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={STATUS_COLORS[mandate.status]}>
                      {STATUS_LABELS[mandate.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/mandates/${mandate.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Mandato</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>ID da Pessoa *</Label>
              <Input
                value={form.person_id}
                onChange={(e) => setForm({ ...form, person_id: e.target.value })}
                placeholder="UUID da pessoa"
              />
            </div>
            <div>
              <Label>Cargo *</Label>
              <Input
                value={form.office}
                onChange={(e) => setForm({ ...form, office: e.target.value })}
                placeholder="Ex: Vereador, Deputado Estadual"
              />
            </div>
            <div>
              <Label>Jurisdição *</Label>
              <Input
                value={form.jurisdiction}
                onChange={(e) => setForm({ ...form, jurisdiction: e.target.value })}
                placeholder="Ex: São Paulo - SP"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Início *</Label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Fim (opcional)</Label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Status *</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v as MandateStatus })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="suspended">Suspenso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Salvando..." : "Criar Mandato"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
