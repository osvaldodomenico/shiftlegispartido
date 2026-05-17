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
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import DashboardBreadcrumb from "@/components/layout/dashboard-breadcrumb";
import { StageSortable } from "@/components/crm/StageSortable";
import {
  getPipelineStages,
  createStage,
  updateStage,
  deleteStage,
} from "@/services/crm-api";
import type { PipelineStage } from "@/types/crm";

const DEFAULT_COLOR = "#6366f1";

export default function PipelineSettingsPage() {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado do dialog de criação/edição
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<PipelineStage | null>(null);
  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState(DEFAULT_COLOR);
  const [saving, setSaving] = useState(false);

  // Estado do dialog de confirmação de exclusão
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function loadStages() {
    try {
      const data = await getPipelineStages();
      setStages(data.sort((a, b) => a.order - b.order));
    } catch {
      toast.error("Erro ao carregar etapas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStages();
  }, []);

  function openCreate() {
    setEditingStage(null);
    setFormName("");
    setFormColor(DEFAULT_COLOR);
    setDialogOpen(true);
  }

  function openEdit(stage: PipelineStage) {
    setEditingStage(stage);
    setFormName(stage.name);
    setFormColor(stage.color);
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
      if (editingStage) {
        // Atualizar etapa existente
        const updated = await updateStage(editingStage.id, {
          name: formName.trim(),
          color: formColor,
        });
        setStages((prev) =>
          prev.map((s) =>
            s.id === editingStage.id ? updated : s
          )
        );
        toast.success("Etapa atualizada");
      } else {
        // Criar nova etapa
        await createStage({ name: formName.trim(), color: formColor });
        await loadStages();
        toast.success("Etapa criada");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Erro ao salvar etapa");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteStage(deleteId);
      setStages((prev) => prev.filter((s) => s.id !== deleteId));
      toast.success("Etapa removida");
    } catch {
      toast.error("Erro ao remover etapa");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  return (
    <>
      <DashboardBreadcrumb
        title="Etapas do Pipeline"
        text="CRM / Configurações / Pipeline"
      />

      <Card className="card border-0 h-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Etapas do Pipeline</CardTitle>
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova Etapa
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Carregando...</p>
          ) : stages.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nenhuma etapa cadastrada. Crie a primeira etapa do pipeline.
            </p>
          ) : (
            <StageSortable
              stages={stages}
              onStagesChange={setStages}
              onEdit={openEdit}
              onDelete={openDelete}
            />
          )}
        </CardContent>
      </Card>

      {/* Dialog criação / edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingStage ? "Editar Etapa" : "Nova Etapa"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="stage-name">Nome</Label>
              <Input
                id="stage-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: Prospecção"
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stage-color">Cor</Label>
              <div className="flex items-center gap-3">
                <input
                  id="stage-color"
                  type="color"
                  value={formColor}
                  onChange={(e) => setFormColor(e.target.value)}
                  className="h-10 w-16 cursor-pointer rounded border border-input bg-background p-1"
                />
                <span className="text-sm text-muted-foreground font-mono">
                  {formColor}
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
        onOpenChange={(open: boolean) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover etapa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Contatos nesta etapa serão
              desassociados.
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
