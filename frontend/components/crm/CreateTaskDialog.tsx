"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { createTask, getContacts } from "@/services/crm-api";
import type { CrmContact, CrmTask } from "@/types/crm";

const schema = z.object({
  title: z.string().min(1, "Título obrigatório"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  due_at: z.string().optional(),
  person_id: z.string().optional(),
  assigned_to_id: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  /** Pré-preenche person_id quando aberto a partir de um contato */
  defaultPersonId?: string;
  /** Se fornecido, edita tarefa existente */
  task?: CrmTask;
}

const PRIORITY_LABELS = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
};

export function CreateTaskDialog({
  open,
  onOpenChange,
  onSuccess,
  defaultPersonId,
  task,
}: CreateTaskDialogProps) {
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [loading, setLoading] = useState(false);

  const isEditing = Boolean(task);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      due_at: "",
      person_id: defaultPersonId ?? "",
      assigned_to_id: "",
    },
  });

  // Carregar contatos para o select de pessoa
  useEffect(() => {
    if (!open) return;
    getContacts()
      .then((data: any) => setContacts(Array.isArray(data) ? data : data?.data ?? []))
      .catch(() => setContacts([]));
  }, [open]);

  // Preencher form ao editar tarefa existente
  useEffect(() => {
    if (task && open) {
      form.reset({
        title: task.title,
        description: task.description ?? "",
        priority: task.priority,
        due_at: task.due_at ? task.due_at.slice(0, 16) : "",
        person_id: task.person?.id ?? defaultPersonId ?? "",
        assigned_to_id: task.assigned_to?.id ?? "",
      });
    } else if (!task && open) {
      form.reset({
        title: "",
        description: "",
        priority: "medium",
        due_at: "",
        person_id: defaultPersonId ?? "",
        assigned_to_id: "",
      });
    }
  }, [task, open, defaultPersonId]);

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      const payload: Parameters<typeof createTask>[0] = {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority,
        due_at: values.due_at || undefined,
        person_id: values.person_id || undefined,
        assigned_to_id: values.assigned_to_id || undefined,
      };
      await createTask(payload);
      onOpenChange(false);
      onSuccess();
    } catch {
      // Erros tratados pela instância axios (toast global ou error boundary)
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Título */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Ligar para João Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Descrição */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalhes da tarefa..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Prioridade + Prazo */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridade</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="dark:bg-slate-700 border-slate-300 dark:border-slate-500">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(Object.entries(PRIORITY_LABELS) as [string, string][]).map(([val, label]) => (
                          <SelectItem key={val} value={val}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="due_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prazo</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Pessoa relacionada */}
            <FormField
              control={form.control}
              name="person_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contato relacionado</FormLabel>
                  <Select value={field.value ?? ""} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="dark:bg-slate-700 border-slate-300 dark:border-slate-500">
                        <SelectValue placeholder="Nenhum" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Nenhum</SelectItem>
                      {contacts.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
                {isEditing ? "Salvar alterações" : "Criar tarefa"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
