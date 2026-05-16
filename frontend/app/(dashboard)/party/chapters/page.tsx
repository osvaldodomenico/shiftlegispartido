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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChapterTree } from "@/components/party/ChapterTree";
import { getChapters, createChapter } from "@/services/party-api";
import type { PartyChapter, ChapterLevel } from "@/types/party";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";

// Nivela a lista flat e injeta children recursivamente
function buildTree(chapters: PartyChapter[]): PartyChapter[] {
  const map = new Map<string, PartyChapter>();
  const roots: PartyChapter[] = [];

  chapters.forEach((c) => map.set(c.id, { ...c, children: [] }));

  map.forEach((chapter) => {
    if (chapter.parent_id && map.has(chapter.parent_id)) {
      map.get(chapter.parent_id)!.children!.push(chapter);
    } else {
      roots.push(chapter);
    }
  });

  return roots;
}

interface ChapterForm {
  name: string;
  level: ChapterLevel | "";
  parent_id: string;
  state: string;
  city: string;
}

const emptyForm: ChapterForm = { name: "", level: "", parent_id: "", state: "", city: "" };

export default function ChaptersPage() {
  const [chapters, setChapters] = useState<PartyChapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ChapterForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await getChapters();
      setChapters(data as PartyChapter[]);
    } catch {
      toast.error("Erro ao carregar diretórios");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSave() {
    if (!form.name.trim() || !form.level) {
      toast.error("Nome e nível são obrigatórios");
      return;
    }
    setSaving(true);
    try {
      await createChapter({
        name: form.name,
        level: form.level as ChapterLevel,
        parent_id: form.parent_id || undefined,
        state: form.state || undefined,
        city: form.city || undefined,
      });
      toast.success("Diretório criado");
      setOpen(false);
      setForm(emptyForm);
      load();
    } catch {
      toast.error("Erro ao criar diretório");
    } finally {
      setSaving(false);
    }
  }

  const tree = buildTree(chapters);
  // Lista flat para o select de pai
  const flatChapters = chapters;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Diretórios Partidários</h1>
          <p className="text-muted-foreground text-sm">
            Estrutura hierárquica de diretórios do partido
          </p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Novo Diretório
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : (
        <ChapterTree chapters={tree} />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Diretório</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Diretório Municipal de São Paulo"
              />
            </div>
            <div>
              <Label>Nível *</Label>
              <Select
                value={form.level}
                onValueChange={(v) => setForm({ ...form, level: v as ChapterLevel })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o nível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nacional">Nacional</SelectItem>
                  <SelectItem value="estadual">Estadual</SelectItem>
                  <SelectItem value="municipal">Municipal</SelectItem>
                  <SelectItem value="zonal">Zonal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Diretório pai (opcional)</Label>
              <Select
                value={form.parent_id}
                onValueChange={(v) => setForm({ ...form, parent_id: v === "_none" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nenhum (raiz)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Nenhum (raiz)</SelectItem>
                  {flatChapters.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Estado</Label>
                <Input
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  placeholder="Ex: SP"
                  maxLength={2}
                />
              </div>
              <div>
                <Label>Cidade</Label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="Ex: São Paulo"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Salvando..." : "Criar Diretório"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
