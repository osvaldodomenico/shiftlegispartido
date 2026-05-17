"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
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
import { getSchedule, createScheduleEvent } from "@/services/electoral-api";
import type { ScheduleEvent, ScheduleEventType, ScheduleEventStatus } from "@/types/electoral";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { ArrowLeft, Plus } from "lucide-react";
import toast from "react-hot-toast";

const TYPE_LABELS: Record<ScheduleEventType, string> = {
  corpo_a_corpo: "Corpo a Corpo",
  comicio: "Comício",
  debate: "Debate",
  reuniao: "Reunião",
  outro: "Outro",
};

const TYPE_COLORS: Record<ScheduleEventType, string> = {
  corpo_a_corpo: "#3b82f6",
  comicio: "#f59e0b",
  debate: "#8b5cf6",
  reuniao: "#10b981",
  outro: "#6b7280",
};

const STATUS_LABELS: Record<ScheduleEventStatus, string> = {
  scheduled: "Agendado",
  done: "Realizado",
  cancelled: "Cancelado",
};

interface EventForm {
  title: string;
  type: ScheduleEventType;
  starts_at: string;
  ends_at: string;
  location: string;
  notes: string;
}

const emptyForm: EventForm = {
  title: "",
  type: "reuniao",
  starts_at: "",
  ends_at: "",
  location: "",
  notes: "",
};

export default function CampaignSchedulePage() {
  const { id } = useParams<{ id: string }>();
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<EventForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await getSchedule(id);
      setEvents(data);
    } catch {
      toast.error("Erro ao carregar agenda");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function handleSave() {
    if (!form.title.trim() || !form.starts_at) {
      toast.error("Título e data/hora de início são obrigatórios");
      return;
    }
    setSaving(true);
    try {
      await createScheduleEvent(id, {
        title: form.title,
        type: form.type,
        starts_at: form.starts_at,
        ends_at: form.ends_at || undefined,
        location: form.location || undefined,
        notes: form.notes || undefined,
      });
      toast.success("Evento criado");
      setOpen(false);
      setForm(emptyForm);
      load();
    } catch {
      toast.error("Erro ao criar evento");
    } finally {
      setSaving(false);
    }
  }

  // Mapeia eventos para o formato do FullCalendar
  const calendarEvents = events.map((e) => ({
    id: e.id,
    title: e.title,
    start: e.starts_at,
    end: e.ends_at,
    backgroundColor: TYPE_COLORS[e.type],
    borderColor: TYPE_COLORS[e.type],
    extendedProps: { type: e.type, status: e.status, location: e.location },
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/electoral/campaigns/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Agenda da Campanha</h1>
            <p className="text-muted-foreground text-sm">Eventos e atividades da campanha</p>
          </div>
        </div>
        <Button onClick={() => { setForm(emptyForm); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Novo Evento
        </Button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(TYPE_LABELS).map(([type, label]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: TYPE_COLORS[type as ScheduleEventType] }}
            />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div className="rounded-lg border bg-white dark:bg-[#273142] p-4">
        {!loading && (
          <FullCalendar
            plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            events={calendarEvents}
            locale="pt-br"
            height="auto"
            buttonText={{ today: "Hoje", month: "Mês", week: "Semana", day: "Dia" }}
          />
        )}
        {loading && (
          <div className="py-16 text-center text-muted-foreground">Carregando agenda...</div>
        )}
      </div>

      {/* Events list */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold">Lista de Eventos ({events.length})</h2>
        <div className="rounded-md border bg-white dark:bg-[#273142]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Título</th>
                <th className="px-4 py-3 text-left font-medium">Tipo</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Início</th>
                <th className="px-4 py-3 text-left font-medium">Local</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                    Nenhum evento agendado
                  </td>
                </tr>
              )}
              {events.map((e) => (
                <tr key={e.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{e.title}</td>
                  <td className="px-4 py-3">
                    <Badge
                      className="text-white"
                      style={{ backgroundColor: TYPE_COLORS[e.type] }}
                    >
                      {TYPE_LABELS[e.type]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-muted-foreground text-xs">
                      {STATUS_LABELS[e.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {new Date(e.starts_at).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {e.location ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Evento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Título do evento"
              />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v as ScheduleEventType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Início</Label>
                <Input
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                />
              </div>
              <div>
                <Label>Fim</Label>
                <Input
                  type="datetime-local"
                  value={form.ends_at}
                  onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Local</Label>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Endereço ou local"
              />
            </div>
            <div>
              <Label>Observações</Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Notas adicionais"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Salvando..." : "Criar Evento"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
