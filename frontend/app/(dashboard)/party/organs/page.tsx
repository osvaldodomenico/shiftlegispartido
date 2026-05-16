"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import {
  getOrgans,
  createOrgan,
  getOrganMembers,
} from "@/services/party-api";
import type { PartyOrgan, OrganMember } from "@/types/party";
import { Plus, Users } from "lucide-react";
import toast from "react-hot-toast";

interface OrganForm {
  name: string;
  description: string;
}

const emptyForm: OrganForm = { name: "", description: "" };

export default function OrgansPage() {
  const [organs, setOrgans] = useState<PartyOrgan[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<OrganForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  // Estado para modal de membros
  const [membersOpen, setMembersOpen] = useState(false);
  const [selectedOrgan, setSelectedOrgan] = useState<PartyOrgan | null>(null);
  const [members, setMembers] = useState<OrganMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await getOrgans();
      setOrgans(data as PartyOrgan[]);
    } catch {
      toast.error("Erro ao carregar órgãos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    setSaving(true);
    try {
      await createOrgan({
        name: form.name,
        description: form.description || undefined,
      });
      toast.success("Órgão criado");
      setCreateOpen(false);
      setForm(emptyForm);
      load();
    } catch {
      toast.error("Erro ao criar órgão");
    } finally {
      setSaving(false);
    }
  }

  async function openMembers(organ: PartyOrgan) {
    setSelectedOrgan(organ);
    setMembersOpen(true);
    setLoadingMembers(true);
    try {
      const data = await getOrganMembers(organ.id);
      setMembers(data as OrganMember[]);
    } catch {
      toast.error("Erro ao carregar membros");
    } finally {
      setLoadingMembers(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Órgãos Partidários</h1>
          <p className="text-muted-foreground text-sm">
            Comissões, comitês e órgãos internos do partido
          </p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setCreateOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Novo Órgão
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : organs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Nenhum órgão cadastrado.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {organs.map((organ) => (
            <Card key={organ.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{organ.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {organ.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {organ.description}
                  </p>
                )}
                {organ.member_count !== undefined && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{organ.member_count} membros</span>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => openMembers(organ)}
                >
                  <Users className="h-4 w-4 mr-2" /> Ver Membros
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Criar órgão */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Órgão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Comissão de Ética"
              />
            </div>
            <div>
              <Label>Descrição (opcional)</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descreva as funções deste órgão..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Salvando..." : "Criar Órgão"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Membros do órgão */}
      <Dialog open={membersOpen} onOpenChange={setMembersOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Membros — {selectedOrgan?.name}
            </DialogTitle>
          </DialogHeader>
          {loadingMembers ? (
            <div className="py-8 text-center text-muted-foreground">Carregando...</div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Pessoa</th>
                    <th className="text-left px-4 py-2 font-medium">Cargo</th>
                    <th className="text-left px-4 py-2 font-medium">Desde</th>
                  </tr>
                </thead>
                <tbody>
                  {members.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                        Nenhum membro cadastrado.
                      </td>
                    </tr>
                  )}
                  {members.map((m) => (
                    <tr key={m.id} className="border-t hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <Link
                          href={`/people/${m.person.id}`}
                          className="text-primary underline-offset-4 hover:underline font-medium"
                          onClick={() => setMembersOpen(false)}
                        >
                          {m.person.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{m.role ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(m.joined_at).toLocaleDateString("pt-BR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
