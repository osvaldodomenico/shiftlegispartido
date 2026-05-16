"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCheck, Pencil, Trash2 } from "lucide-react";
import type { CrmTask, TaskStatus, TaskPriority } from "@/types/crm";
import { CreateTaskDialog } from "./CreateTaskDialog";

// --- Labels e cores ---

const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: "Pendente",
  in_progress: "Em andamento",
  done: "Concluída",
  cancelled: "Cancelada",
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  done: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
};

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

// --- Helpers ---

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isOverdue(dateStr?: string, status?: TaskStatus): boolean {
  if (!dateStr || status === "done" || status === "cancelled") return false;
  return new Date(dateStr) < new Date();
}

// --- Props ---

interface TaskListProps {
  tasks: CrmTask[];
  onStatusChange: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRefresh?: () => void;
}

// --- Componente ---

export function TaskList({ tasks, onStatusChange, onDelete, onRefresh }: TaskListProps) {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterDue, setFilterDue] = useState<string>("all");
  const [editTask, setEditTask] = useState<CrmTask | null>(null);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (filterStatus !== "all" && t.status !== filterStatus) return false;
      if (filterPriority !== "all" && t.priority !== filterPriority) return false;
      if (filterDue === "overdue" && !isOverdue(t.due_at, t.status)) return false;
      if (filterDue === "today") {
        if (!t.due_at) return false;
        const d = new Date(t.due_at);
        const now = new Date();
        return (
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth() &&
          d.getDate() === now.getDate()
        );
      }
      return true;
    });
  }, [tasks, filterStatus, filterPriority, filterDue]);

  async function handleComplete(id: string) {
    await onStatusChange(id);
  }

  async function handleDelete(id: string) {
    if (!confirm("Deseja excluir esta tarefa?")) return;
    await onDelete(id);
  }

  return (
    <div className="space-y-3">
      {/* Barra de filtros */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Filtro por status */}
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="min-w-[150px] focus-visible:ring-0 dark:bg-slate-700 border-slate-300 dark:border-slate-500">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {(Object.entries(STATUS_LABELS) as [TaskStatus, string][]).map(([val, label]) => (
              <SelectItem key={val} value={val}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filtro por prioridade */}
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="min-w-[150px] focus-visible:ring-0 dark:bg-slate-700 border-slate-300 dark:border-slate-500">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as prioridades</SelectItem>
            {(Object.entries(PRIORITY_LABELS) as [TaskPriority, string][]).map(([val, label]) => (
              <SelectItem key={val} value={val}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filtro por prazo */}
        <Select value={filterDue} onValueChange={setFilterDue}>
          <SelectTrigger className="min-w-[150px] focus-visible:ring-0 dark:bg-slate-700 border-slate-300 dark:border-slate-500">
            <SelectValue placeholder="Prazo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os prazos</SelectItem>
            <SelectItem value="today">Vence hoje</SelectItem>
            <SelectItem value="overdue">Atrasadas</SelectItem>
          </SelectContent>
        </Select>

        <span className="text-xs text-neutral-400 ml-auto">
          {filtered.length} tarefa{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Tabela */}
      <div className="rounded-md border border-neutral-200 dark:border-slate-700 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-neutral-50 dark:bg-slate-800/40">
              <TableHead className="font-semibold text-neutral-600 dark:text-neutral-300">Título</TableHead>
              <TableHead className="font-semibold text-neutral-600 dark:text-neutral-300">Contato</TableHead>
              <TableHead className="font-semibold text-neutral-600 dark:text-neutral-300">Prioridade</TableHead>
              <TableHead className="font-semibold text-neutral-600 dark:text-neutral-300">Status</TableHead>
              <TableHead className="font-semibold text-neutral-600 dark:text-neutral-300">Prazo</TableHead>
              <TableHead className="font-semibold text-neutral-600 dark:text-neutral-300">Responsável</TableHead>
              <TableHead className="font-semibold text-neutral-600 dark:text-neutral-300 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16 text-neutral-400 text-sm">
                  Nenhuma tarefa encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((task) => {
                const overdue = isOverdue(task.due_at, task.status);
                return (
                  <TableRow
                    key={task.id}
                    className="hover:bg-neutral-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Título */}
                    <TableCell className="font-medium text-neutral-800 dark:text-neutral-200 max-w-xs">
                      <span className={task.status === "done" ? "line-through text-neutral-400" : ""}>
                        {task.title}
                      </span>
                      {task.description && (
                        <p className="text-xs text-neutral-400 truncate mt-0.5">{task.description}</p>
                      )}
                    </TableCell>

                    {/* Pessoa */}
                    <TableCell>
                      {task.person ? (
                        <Link
                          href={`/crm/contacts/${task.person.id}`}
                          className="text-sm text-primary hover:underline"
                        >
                          {task.person.name}
                        </Link>
                      ) : (
                        <span className="text-neutral-400 text-xs">—</span>
                      )}
                    </TableCell>

                    {/* Prioridade */}
                    <TableCell>
                      <span
                        className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[task.priority]}`}
                      >
                        {PRIORITY_LABELS[task.priority]}
                      </span>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <span
                        className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[task.status]}`}
                      >
                        {STATUS_LABELS[task.status]}
                      </span>
                    </TableCell>

                    {/* Prazo */}
                    <TableCell>
                      <span className={`text-sm ${overdue ? "text-red-500 font-medium" : "text-neutral-600 dark:text-neutral-300"}`}>
                        {formatDate(task.due_at)}
                        {overdue && <span className="ml-1 text-xs">(atrasada)</span>}
                      </span>
                    </TableCell>

                    {/* Responsável */}
                    <TableCell className="text-sm text-neutral-600 dark:text-neutral-300">
                      {task.assigned_to?.name ?? <span className="text-neutral-400 text-xs">—</span>}
                    </TableCell>

                    {/* Ações */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {task.status !== "done" && task.status !== "cancelled" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                            title="Concluir tarefa"
                            onClick={() => handleComplete(task.id)}
                          >
                            <CheckCheck className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-neutral-500 hover:text-neutral-700"
                          title="Editar tarefa"
                          onClick={() => setEditTask(task)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Excluir tarefa"
                          onClick={() => handleDelete(task.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog de edição */}
      <CreateTaskDialog
        open={Boolean(editTask)}
        onOpenChange={(v) => { if (!v) setEditTask(null); }}
        task={editTask ?? undefined}
        onSuccess={() => {
          setEditTask(null);
          onRefresh?.();
        }}
      />
    </div>
  );
}
