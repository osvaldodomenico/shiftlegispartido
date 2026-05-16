"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import * as crmApi from "@/services/crm-api";
import type { CrmTask, TaskPriority } from "@/types/crm";
import { CheckSquare, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
};

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function formatDate(dateStr?: string) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

interface AddTaskDialogProps {
  personId: string;
  onAdded: () => void;
}

function AddTaskDialog({ personId, onAdded }: AddTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium" as TaskPriority,
    due_at: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setLoading(true);
    try {
      await crmApi.createTask({
        title: form.title,
        description: form.description || undefined,
        priority: form.priority,
        due_at: form.due_at ? new Date(form.due_at).toISOString() : undefined,
        person_id: personId,
      });
      setOpen(false);
      setForm({ title: "", description: "", priority: "medium", due_at: "" });
      onAdded();
    } catch {
      // silencia
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1">
          <Plus className="w-4 h-4" />
          Nova tarefa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar tarefa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Título <span className="text-red-500">*</span></Label>
            <Input
              placeholder="Descreva a tarefa..."
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Descrição</Label>
            <Textarea
              placeholder="Detalhes opcionais..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Prioridade</Label>
              <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v as TaskPriority }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Prazo</Label>
              <Input
                type="date"
                value={form.due_at}
                onChange={(e) => setForm((f) => ({ ...f, due_at: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface ContactTasksProps {
  personId: string;
  tasks: CrmTask[];
  onRefresh: () => void;
}

export function ContactTasks({ personId, tasks, onRefresh }: ContactTasksProps) {
  const [completing, setCompleting] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleComplete(id: string) {
    setCompleting(id);
    try {
      await crmApi.completeTask(id);
      onRefresh();
    } catch {
      // silencia
    } finally {
      setCompleting(null);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await crmApi.deleteTask(id);
      onRefresh();
    } catch {
      // silencia
    } finally {
      setDeleting(null);
    }
  }

  const pending = tasks.filter((t) => t.status !== "done" && t.status !== "cancelled");
  const done = tasks.filter((t) => t.status === "done" || t.status === "cancelled");

  return (
    <Card className="border-0">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-neutral-200 dark:border-slate-600">
        <div className="flex items-center gap-2 font-semibold text-base">
          <CheckSquare className="w-4 h-4 text-primary" />
          Tarefas
          {pending.length > 0 && (
            <Badge variant="secondary" className="text-xs">{pending.length} pendente{pending.length !== 1 ? "s" : ""}</Badge>
          )}
        </div>
        <AddTaskDialog personId={personId} onAdded={onRefresh} />
      </CardHeader>
      <CardContent className="p-0">
        {tasks.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400 p-6 text-center">
            Nenhuma tarefa registrada ainda.
          </p>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-slate-700">
            {[...pending, ...done].map((task) => {
              const isDone = task.status === "done" || task.status === "cancelled";
              return (
                <div key={task.id} className="flex items-start gap-3 p-4">
                  <Checkbox
                    checked={isDone}
                    disabled={isDone || completing === task.id}
                    onCheckedChange={() => !isDone && handleComplete(task.id)}
                    className="mt-0.5 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium leading-snug ${isDone ? "line-through text-neutral-400" : "text-neutral-800 dark:text-neutral-200"}`}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{task.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`inline-flex items-center text-xs px-1.5 py-0.5 rounded font-medium ${PRIORITY_COLORS[task.priority]}`}>
                        {PRIORITY_LABELS[task.priority]}
                      </span>
                      {task.due_at && (
                        <span className="text-xs text-neutral-400">
                          Prazo: {formatDate(task.due_at)}
                        </span>
                      )}
                      {task.assigned_to && (
                        <span className="text-xs text-neutral-400">
                          Atribuída a: {task.assigned_to.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-neutral-400 hover:text-red-500 shrink-0"
                    onClick={() => handleDelete(task.id)}
                    disabled={deleting === task.id}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
