"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
import {
  getChapter,
  getChapterMembers,
  addChapterMember,
  removeChapterMember,
} from "@/services/party-api";
import type { PartyChapter, ChapterMember } from "@/types/party";
import { ArrowLeft, Plus, Trash2, MapPin, Users } from "lucide-react";
import toast from "react-hot-toast";

const LEVEL_COLORS: Record<string, string> = {
  nacional: "bg-purple-100 text-purple-700",
  estadual: "bg-blue-100 text-blue-700",
  municipal: "bg-green-100 text-green-700",
  zonal: "bg-orange-100 text-orange-700",
};

const LEVEL_LABELS: Record<string, string> = {
  nacional: "Nacional",
  estadual: "Estadual",
  municipal: "Municipal",
  zonal: "Zonal",
};

export default function ChapterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [chapter, setChapter] = useState<PartyChapter | null>(null);
  const [members, setMembers] = useState<ChapterMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [personId, setPersonId] = useState("");
  const [role, setRole] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [ch, mbs] = await Promise.all([getChapter(id), getChapterMembers(id)]);
      setChapter(ch.data as PartyChapter);
      setMembers(mbs.data as ChapterMember[]);
    } catch {
      toast.error("Erro ao carregar diretório");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function handleAddMember() {
    if (!personId.trim()) {
      toast.error("ID da pessoa é obrigatório");
      return;
    }
    setSaving(true);
    try {
      await addChapterMember(id, personId, role || undefined);
      toast.success("Membro adicionado");
      setAddOpen(false);
      setPersonId("");
      setRole("");
      load();
    } catch {
      toast.error("Erro ao adicionar membro");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveMember(memberId: string) {
    try {
      await removeChapterMember(id, memberId);
      toast.success("Membro removido");
      load();
    } catch {
      toast.error("Erro ao remover membro");
    }
  }

  if (loading) {
    return <div className="p-6 text-center text-muted-foreground">Carregando...</div>;
  }

  if (!chapter) {
    return <div className="p-6 text-center text-muted-foreground">Diretório não encontrado.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/party/chapters">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{chapter.name}</h1>
          <p className="text-muted-foreground text-sm">Detalhes do diretório</p>
        </div>
      </div>

      {/* Metadata card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informações</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground mb-1">Nível</p>
            <Badge className={LEVEL_COLORS[chapter.level] ?? ""}>
              {LEVEL_LABELS[chapter.level] ?? chapter.level}
            </Badge>
          </div>
          {(chapter.state || chapter.city) && (
            <div>
              <p className="text-muted-foreground mb-1 flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Localização
              </p>
              <p className="font-medium">
                {[chapter.city, chapter.state].filter(Boolean).join(" - ")}
              </p>
            </div>
          )}
          {chapter.member_count !== undefined && (
            <div>
              <p className="text-muted-foreground mb-1 flex items-center gap-1">
                <Users className="h-3 w-3" /> Membros
              </p>
              <p className="font-medium">{chapter.member_count}</p>
            </div>
          )}
          {chapter.parent_id && (
            <div>
              <p className="text-muted-foreground mb-1">Diretório pai</p>
              <Link
                href={`/party/chapters/${chapter.parent_id}`}
                className="text-primary underline-offset-4 hover:underline font-medium"
              >
                Ver pai
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Members table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Membros</h2>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar Membro
          </Button>
        </div>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Pessoa</th>
                <th className="text-left px-4 py-2 font-medium">Cargo</th>
                <th className="text-left px-4 py-2 font-medium">Desde</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {members.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
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
                    >
                      {m.person.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{m.role ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(m.joined_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover membro</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja remover <strong>{m.person.name}</strong> deste diretório?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => handleRemoveMember(m.id)}
                          >
                            Remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add member dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Adicionar Membro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>ID da Pessoa *</Label>
              <Input
                value={personId}
                onChange={(e) => setPersonId(e.target.value)}
                placeholder="UUID da pessoa"
              />
            </div>
            <div>
              <Label>Cargo (opcional)</Label>
              <Input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Ex: Secretário"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddMember} disabled={saving}>
                {saving ? "Adicionando..." : "Adicionar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
