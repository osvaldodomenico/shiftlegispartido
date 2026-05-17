"use client";

import { useState, useEffect } from "react";
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
import { getElections, createElection, updateElection } from "@/services/electoral-api";
import type { Election } from "@/types/electoral";
import { Plus, Eye, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

interface ElectionForm {
  name: string;
  election_date: string;
  runoff_date: string;
}

const emptyForm: ElectionForm = { name: "", election_date: "", runoff_date: "" };

export default function ElectionsPage() {
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editElection, setEditElection] = useState<Election | null>(null);
  const [form, setForm] = useState<ElectionForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await getElections();
      setElections(data);
    } catch {
      toast.error("Erro ao carregar eleições");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    setEditElection(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(e: Election) {
    setEditElection(e);
    setForm({
      name: e.name,
      election_date: e.election_date.slice(0, 10),
      runoff_date: e.runoff_date ? e.runoff_date.slice(0, 10) : "",
    });
    setOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.election_date) {
      toast.error("Nome e data da eleição são obrigatórios");
      return;
    }
    setSaving(true);
    try {
      const payload: Partial<Election> = {
        name: form.name,
        election_date: form.election_date,
        runoff_date: form.runoff_date || undefined,
      };
      if (editElection) {
        await updateElection(editElection.id, payload);
        toast.success("Eleição atualizada");
      } else {
        await createElection(payload);
        toast.success("Eleição criada");
      }
      setOpen(false);
      load();
    } catch {
      toast.error("Erro ao salvar eleição");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Eleições</h1>
          <p className="text-muted-foreground text-sm">Gestão de eleições do partido</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" /> Nova Eleição
        </Button>
      </div>

      <div className="rounded-md border bg-white dark:bg-[#273142]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Nome</th>
              <th className="px-4 py-3 text-left font-medium">Data da Eleição</th>
              <th className="px-4 py-3 text-left font-medium">2º Turno</th>
              <th className="px-4 py-3 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  Carregando...
                </td>
              </tr>
            )}
            {!loading && elections.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhuma eleição cadastrada
                </td>
              </tr>
            )}
            {elections.map((election) => (
              <tr key={election.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{election.name}</td>
                <td className="px-4 py-3">
                  {new Date(election.election_date).toLocaleDateString("pt-BR")}
                </td>
                <td className="px-4 py-3">
                  {election.runoff_date
                    ? new Date(election.runoff_date).toLocaleDateString("pt-BR")
                    : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-4 py-3 text-right space-x-1">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/electoral/elections/${election.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(election)}>
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
            <DialogTitle>{editElection ? "Editar Eleição" : "Nova Eleição"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Eleições Municipais 2024"
              />
            </div>
            <div>
              <Label>Data da Eleição</Label>
              <Input
                type="date"
                value={form.election_date}
                onChange={(e) => setForm({ ...form, election_date: e.target.value })}
              />
            </div>
            <div>
              <Label>Data do 2º Turno (opcional)</Label>
              <Input
                type="date"
                value={form.runoff_date}
                onChange={(e) => setForm({ ...form, runoff_date: e.target.value })}
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
