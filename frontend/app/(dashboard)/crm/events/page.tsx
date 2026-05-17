"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { getEvents } from "@/services/crm-api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { List, Calendar, MapPin, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import DashboardBreadcrumb from "@/components/layout/dashboard-breadcrumb";
import type { CrmEvent } from "@/types/crm";

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<CrmEvent[]>([]);
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getEvents()
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Erro ao carregar eventos"))
      .finally(() => setLoading(false));
  }, []);

  // Mapeia eventos para o formato do FullCalendar
  const calEvents = events.map((e) => ({
    id: e.id,
    title: e.title,
    start: e.starts_at,
    end: e.ends_at ?? undefined,
  }));

  return (
    <>
      <DashboardBreadcrumb items={[{ label: "CRM" }, { label: "Eventos" }]} />

      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Eventos</h1>
          <div className="flex gap-2">
            <Button
              variant={view === "calendar" ? "default" : "outline"}
              size="icon"
              onClick={() => setView("calendar")}
              title="Visualização calendário"
            >
              <Calendar className="h-4 w-4" />
            </Button>
            <Button
              variant={view === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setView("list")}
              title="Visualização lista"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {loading ? (
          <Skeleton className="h-[500px] w-full rounded-xl" />
        ) : view === "calendar" ? (
          <div className="rounded-lg border bg-card p-2">
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              locale="pt-br"
              events={calEvents}
              eventClick={(info) => router.push(`/crm/events/${info.event.id}`)}
              height={520}
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,dayGridWeek",
              }}
              buttonText={{
                today: "Hoje",
                month: "Mês",
                week: "Semana",
              }}
            />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Calendar className="mx-auto h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm">Nenhum evento encontrado.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="rounded-lg border bg-card p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => router.push(`/crm/events/${ev.id}`)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{ev.title}</h3>
                    {ev.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {ev.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-3 mt-2">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDate(ev.starts_at)}
                        {ev.ends_at && ` → ${formatDate(ev.ends_at)}`}
                      </span>
                      {ev.location && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {ev.location}
                        </span>
                      )}
                    </div>
                  </div>
                  {ev.attendances && ev.attendances.length > 0 && (
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {ev.attendances.length} participante
                      {ev.attendances.length !== 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
