"use client";
import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { getEvents } from "@/services/crm-api";
import { Button } from "@/components/ui/button";
import { List, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import type { CrmEvent } from "@/types/crm";

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<CrmEvent[]>([]);
  const [view, setView] = useState<"calendar" | "list">("calendar");

  useEffect(() => {
    getEvents().then((e) => setEvents(e as any));
  }, []);

  // Mapeia eventos para o formato do FullCalendar
  const calEvents = events.map((e) => ({
    id: e.id,
    title: e.title,
    start: e.starts_at,
    end: e.ends_at,
  }));

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Eventos</h1>
        <div className="flex gap-2">
          <Button
            variant={view === "calendar" ? "default" : "outline"}
            size="icon"
            onClick={() => setView("calendar")}
          >
            <Calendar className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setView("list")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button>Novo Evento</Button>
        </div>
      </div>

      {view === "calendar" ? (
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale="pt-br"
          events={calEvents}
          eventClick={(info) => router.push(`/crm/events/${info.event.id}`)}
          height="auto"
        />
      ) : (
        <div className="space-y-2">
          {events.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum evento encontrado.
            </p>
          )}
          {events.map((e) => (
            <div
              key={e.id}
              className="border rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50"
              onClick={() => router.push(`/crm/events/${e.id}`)}
            >
              <div>
                <p className="font-medium">{e.title}</p>
                <p className="text-sm text-muted-foreground">{e.location}</p>
              </div>
              <span className="text-sm text-muted-foreground">
                {new Date(e.starts_at).toLocaleDateString("pt-BR")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
