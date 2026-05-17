"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getMandate, updateMandate, deleteMandate } from "@/services/party-api";
import type { Mandate, MandateStatus } from "@/types/party";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
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
  office: string;
  jurisdiction: string;
  start_date: string;
  end_date: string;
  status: MandateStatus;
}

export default function MandateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [mandate, setMandate] = useState<Mandate | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<MandateForm>({
    office: "",
    jurisdiction: "",
    start_date: "",
    end_date: "",
    status: "active",
  });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await getMandate(id);
      const m = data.data as Mandate;
      setMandate(m);
      setForm({
        office: m.office,
        jurisdiction: m.jurisdiction,
        start_date: m.start_date.slice(0, 10),
        end_date: m.end_date ? m.end_date.slice(0, 10) : "",
        status: m.status,
      });
    } catch {
      toast.error("Erro ao carregar mandato");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function handleSave() {
    if (!form.office.trim() || !form.jurisdiction.trim() || !form.start_date) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    setSaving(true);
    try {
      await updateMandate(id, {
        office: form.office,
        jurisdiction: form.jurisdiction,
        start_date: form.start_date,
        end_date: form.end_date || undefined,
        status: form.status,
      });
      toast.success("Mandato atualizado");
      setEditOpen(false);
      load();
    } catch {
      toast.error("Erro ao atualizar mandato");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      await deleteMandate(id);
      toast.success("Mandato removido");
      router.push("/mandates");
    } catch {
      toast.error("Erro ao remover mandato");
    }
  }

  if (loading) {
    return <div className="p-6 text-center text-muted-foreground">Carregando...</div>;
  }

  if (!mandate) {
    return <div className="p-6 text-center text-muted-foreground">Mandato não encontrado.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/mandates">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{mandate.office}</h1>
          <p className="text-muted-foreground text-sm">{mandate.jurisdiction}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4 mr-2" /> Editar
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remover mandato</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja remover o mandato de{" "}
                  <strong>{mandate.person.name}</strong>? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={handleDelete}
                >
                  Remover
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Detail card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informações do Mandato</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
          <div>
            <p className="text-muted-foreground mb-1">Titular</p>
            <Link
              href={`/people/${mandate.person.id}`}
              className="text-primary underline-offset-4 hover:underline font-medium"
            >
              {mandate.person.name}
            </Link>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Cargo</p>
            <p className="font-medium">{mandate.office}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Jurisdição</p>
            <p className="font-medium">{mandate.jurisdiction}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Início</p>
            <p className="font-medium">
              {new Date(mandate.start_date).toLocaleDateString("pt-BR")}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Fim</p>
            <p className="font-medium">
              {mandate.end_date
                ? new Date(mandate.end_date).toLocaleDateString("pt-BR")
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Status</p>
            <Badge className={STATUS_COLORS[mandate.status]}>
              {STATUS_LABELS[mandate.status]}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Mandato</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Cargo *</Label>
              <Input
                value={form.office}
                onChange={(e) => setForm({ ...form, office: e.target.value })}
                placeholder="Ex: Vereador"
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
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="suspended">Suspenso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>
                Cancelar
              </Button>
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
