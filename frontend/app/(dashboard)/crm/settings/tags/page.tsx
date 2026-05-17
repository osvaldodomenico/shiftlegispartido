"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import DashboardBreadcrumb from "@/components/layout/dashboard-breadcrumb";
import {
  getTags,
  createTag,
  updateTag,
  deleteTag,
} from "@/services/crm-api";
import type { CrmTag } from "@/types/crm";

const DEFAULT_COLOR = "#10b981";

export default function TagsSettingsPage() {
  const [tags, setTags] = useState<CrmTag[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado do dialog de criação/edição
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<CrmTag | null>(null);
  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState(DEFAULT_COLOR);
  const [saving, setSaving] = useState(false);

  // Estado do dialog de confirmação de exclusão
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function loadTags() {
    try {
      const data = await getTags();
      setTags(data.data as CrmTag[]);
    } catch {
      toast.error("Erro ao carregar tags");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTags();
  }, []);

  function openCreate() {
    setEditingTag(null);
    setFormName("");
    setFormColor(DEFAULT_COLOR);
    setDialogOpen(true);
  }

  function openEdit(tag: CrmTag) {
    setEditingTag(tag);
    setFormName(tag.name);
    setFormColor(tag.color);
    setDialogOpen(true);
  }

  function openDelete(id: string) {
    setDeleteId(id);
  }

  async function handleSave() {
    if (!formName.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    setSaving(true);
    try {
      if (editingTag) {
        // Atualizar tag existente
        const updated = await updateTag(editingTag.id, {
          name: formName.trim(),
          color: formColor,
        });
        setTags((prev) =>
          prev.map((t) => (t.id === editingTag.id ? (updated.data as CrmTag) : t))
        );
        toast.success("Tag atualizada");
      } else {
        // Criar nova tag
        const created = await createTag({ name: formName.trim(), color: formColor });
        setTags((prev) => [...prev, created.data as CrmTag]);
        toast.success("Tag criada");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Erro ao salvar tag");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteTag(deleteId);
      setTags((prev) => prev.filter((t) => t.id !== deleteId));
      toast.success("Tag removida");
    } catch {
      toast.error("Erro ao remover tag");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  return (
    <>
      <DashboardBreadcrumb
        title="Tags do CRM"
        text="CRM / Configurações / Tags"
      />

      <Card className="card border-0 h-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tags</CardTitle>
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova Tag
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Carregando...</p>
          ) : tags.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nenhuma tag cadastrada. Crie a primeira tag para organizar seus contatos.
            </p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {tags.map((tag) => (
                <TagChip
                  key={tag.id}
                  tag={tag}
                  onEdit={() => openEdit(tag)}
                  onDelete={() => openDelete(tag.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog criação / edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTag ? "Editar Tag" : "Nova Tag"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="tag-name">Nome</Label>
              <Input
                id="tag-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: VIP, Parceiro, Pendente"
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tag-color">Cor</Label>
              <div className="flex items-center gap-3">
                <input
                  id="tag-color"
                  type="color"
                  value={formColor}
                  onChange={(e) => setFormColor(e.target.value)}
                  className="h-10 w-16 cursor-pointer rounded border border-input bg-background p-1"
                />
                <span className="text-sm text-muted-foreground font-mono">
                  {formColor}
                </span>
                {/* Preview do chip */}
                <span
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: formColor }}
                >
                  {formName || "Preview"}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog de confirmação de exclusão */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover tag?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A tag será removida de todos os
              contatos que a utilizam.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Componente de chip de tag com ações inline
function TagChip({
  tag,
  onEdit,
  onDelete,
}: {
  tag: CrmTag;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-white transition-all"
      style={{ backgroundColor: tag.color }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span>{tag.name}</span>
      {hovered && (
        <>
          <button
            onClick={onEdit}
            className="ml-1 rounded-full p-0.5 hover:bg-white/20 transition-colors"
            title="Editar"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            onClick={onDelete}
            className="rounded-full p-0.5 hover:bg-white/20 transition-colors"
            title="Remover"
          >
            <X className="h-3 w-3" />
          </button>
        </>
      )}
    </div>
  );
}
