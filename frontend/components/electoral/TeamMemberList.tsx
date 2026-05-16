"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { addTeamMember, updateTeamMember } from "@/services/electoral-api";
import type { TeamMember, TeamMemberRole, TeamMemberPaymentType } from "@/types/electoral";
import { Pencil, Trash2, Plus } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  campaignId: string;
  members: TeamMember[];
  onRefresh: () => void;
}

const ROLE_LABELS: Record<TeamMemberRole, string> = {
  coordenador: "Coordenador",
  cabo_eleitoral: "Cabo Eleitoral",
  voluntario: "Voluntário",
  assessor: "Assessor",
};

const ROLE_COLORS: Record<TeamMemberRole, string> = {
  coordenador: "bg-purple-100 text-purple-700",
  cabo_eleitoral: "bg-blue-100 text-blue-700",
  voluntario: "bg-green-100 text-green-700",
  assessor: "bg-orange-100 text-orange-700",
};

interface MemberForm {
  person_id: string;
  person_name: string;
  role: TeamMemberRole;
  payment_type: TeamMemberPaymentType;
  salary: string;
}

const emptyForm: MemberForm = {
  person_id: "",
  person_name: "",
  role: "voluntario",
  payment_type: "volunteer",
  salary: "",
};

export function TeamMemberList({ campaignId, members, onRefresh }: Props) {
  const [open, setOpen] = useState(false);
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [form, setForm] = useState<MemberForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  function openAdd() {
    setEditMember(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(m: TeamMember) {
    setEditMember(m);
    setForm({
      person_id: m.person.id,
      person_name: m.person.name,
      role: m.role,
      payment_type: m.payment_type,
      salary: m.salary ? String(m.salary) : "",
    });
    setOpen(true);
  }

  async function handleSave() {
    if (!form.person_name.trim()) {
      toast.error("Nome da pessoa é obrigatório");
      return;
    }
    setSaving(true);
    try {
      const payload: Partial<TeamMember> = {
        role: form.role,
        payment_type: form.payment_type,
        salary: form.payment_type === "paid" && form.salary ? Number(form.salary) : undefined,
      };
      if (editMember) {
        await updateTeamMember(campaignId, editMember.id, payload);
        toast.success("Membro atualizado");
      } else {
        await addTeamMember(campaignId, { ...payload, person: { id: form.person_id, name: form.person_name } });
        toast.success("Membro adicionado");
      }
      setOpen(false);
      onRefresh();
    } catch {
      toast.error("Erro ao salvar membro");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-muted-foreground">
          {members.length} membro(s)
        </h3>
        <Button size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4 mr-1" /> Adicionar Membro
        </Button>
      </div>

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-2 text-left font-medium">Pessoa</th>
              <th className="px-4 py-2 text-left font-medium">Função</th>
              <th className="px-4 py-2 text-left font-medium">Tipo</th>
              <th className="px-4 py-2 text-left font-medium">Remuneração</th>
              <th className="px-4 py-2 text-left font-medium">Entrada</th>
              <th className="px-4 py-2 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  Nenhum membro na equipe
                </td>
              </tr>
            )}
            {members.map((m) => (
              <tr key={m.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-2 font-medium">{m.person.name}</td>
                <td className="px-4 py-2">
                  <Badge className={ROLE_COLORS[m.role]}>{ROLE_LABELS[m.role]}</Badge>
                </td>
                <td className="px-4 py-2">
                  {m.payment_type === "paid" ? (
                    <Badge className="bg-yellow-100 text-yellow-700">Remunerado</Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-600">Voluntário</Badge>
                  )}
                </td>
                <td className="px-4 py-2">
                  {m.payment_type === "paid" && m.salary
                    ? `R$ ${m.salary.toLocaleString("pt-BR")}`
                    : "—"}
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {new Date(m.joined_at).toLocaleDateString("pt-BR")}
                </td>
                <td className="px-4 py-2 text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(m)}>
                    <Pencil className="h-4 w-4" />
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
            <DialogTitle>{editMember ? "Editar Membro" : "Adicionar Membro"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome da Pessoa</Label>
              <Input
                value={form.person_name}
                onChange={(e) => setForm({ ...form, person_name: e.target.value })}
                placeholder="Nome completo"
                disabled={!!editMember}
              />
            </div>
            <div>
              <Label>Função</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm({ ...form, role: v as TeamMemberRole })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo de Pagamento</Label>
              <Select
                value={form.payment_type}
                onValueChange={(v) => setForm({ ...form, payment_type: v as TeamMemberPaymentType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="volunteer">Voluntário</SelectItem>
                  <SelectItem value="paid">Remunerado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.payment_type === "paid" && (
              <div>
                <Label>Salário (R$)</Label>
                <Input
                  type="number"
                  value={form.salary}
                  onChange={(e) => setForm({ ...form, salary: e.target.value })}
                  placeholder="0,00"
                />
              </div>
            )}
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
