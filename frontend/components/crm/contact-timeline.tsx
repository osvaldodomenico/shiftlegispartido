"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import * as crmApi from "@/services/crm-api";
import type { Interaction, InteractionDirection, InteractionType } from "@/types/crm";
import {
  Mail,
  MessageCircle,
  MoreHorizontal,
  Phone,
  Plus,
  Trash2,
  Users,
  Video,
} from "lucide-react";
import { useState } from "react";

const INTERACTION_ICONS: Record<InteractionType, React.ReactNode> = {
  ligacao: <Phone className="w-4 h-4" />,
  whatsapp: <MessageCircle className="w-4 h-4" />,
  reuniao: <Video className="w-4 h-4" />,
  email: <Mail className="w-4 h-4" />,
  outro: <MoreHorizontal className="w-4 h-4" />,
};

const INTERACTION_LABELS: Record<InteractionType, string> = {
  ligacao: "Ligação",
  whatsapp: "WhatsApp",
  reuniao: "Reunião",
  email: "E-mail",
  outro: "Outro",
};

const DIRECTION_LABELS: Record<InteractionDirection, string> = {
  inbound: "Entrada",
  outbound: "Saída",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface AddInteractionDialogProps {
  personId: string;
  onAdded: () => void;
}

function AddInteractionDialog({ personId, onAdded }: AddInteractionDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    type: "ligacao" as InteractionType,
    direction: "outbound" as InteractionDirection,
    notes: "",
    occurred_at: new Date().toISOString().slice(0, 16),
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await crmApi.createInteraction({
        person_id: personId,
        type: form.type,
        direction: form.direction,
        notes: form.notes || undefined,
        occurred_at: new Date(form.occurred_at).toISOString(),
      });
      setOpen(false);
      setForm({ type: "ligacao", direction: "outbound", notes: "", occurred_at: new Date().toISOString().slice(0, 16) });
      onAdded();
    } catch {
      // silencia — erro de rede ou autenticação
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1">
          <Plus className="w-4 h-4" />
          Registrar interação
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova interação</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as InteractionType }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(INTERACTION_LABELS) as InteractionType[]).map((t) => (
                    <SelectItem key={t} value={t}>{INTERACTION_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Direção</Label>
              <Select value={form.direction} onValueChange={(v) => setForm((f) => ({ ...f, direction: v as InteractionDirection }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="outbound">Saída</SelectItem>
                  <SelectItem value="inbound">Entrada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label>Data/hora</Label>
            <Input
              type="datetime-local"
              value={form.occurred_at}
              onChange={(e) => setForm((f) => ({ ...f, occurred_at: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Observações</Label>
            <Textarea
              placeholder="Detalhes da interação..."
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface ContactTimelineProps {
  personId: string;
  interactions: Interaction[];
  onRefresh: () => void;
}

export function ContactTimeline({ personId, interactions, onRefresh }: ContactTimelineProps) {
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await crmApi.deleteInteraction(id);
      onRefresh();
    } catch {
      // silencia
    } finally {
      setDeleting(null);
    }
  }

  return (
    <Card className="border-0">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-neutral-200 dark:border-slate-600">
        <div className="flex items-center gap-2 font-semibold text-base">
          <Users className="w-4 h-4 text-primary" />
          Histórico de interações
        </div>
        <AddInteractionDialog personId={personId} onAdded={onRefresh} />
      </CardHeader>
      <CardContent className="p-0">
        {interactions.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400 p-6 text-center">
            Nenhuma interação registrada ainda.
          </p>
        ) : (
          <ol className="relative border-l border-neutral-200 dark:border-slate-600 ml-6 my-4 space-y-6">
            {interactions.map((item) => (
              <li key={item.id} className="ml-6">
                <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary ring-4 ring-white dark:ring-slate-800">
                  {INTERACTION_ICONS[item.type]}
                </span>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{INTERACTION_LABELS[item.type]}</span>
                      <Badge variant="secondary" className="text-xs">
                        {DIRECTION_LABELS[item.direction]}
                      </Badge>
                    </div>
                    {item.notes && (
                      <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1">{item.notes}</p>
                    )}
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                      {formatDate(item.occurred_at)} — por {item.created_by.name}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-neutral-400 hover:text-red-500 shrink-0"
                    onClick={() => handleDelete(item.id)}
                    disabled={deleting === item.id}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
