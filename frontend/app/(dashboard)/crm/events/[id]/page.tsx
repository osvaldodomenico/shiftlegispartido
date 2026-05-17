"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { getEvent, getEventAttendances, updateAttendance } from "@/services/crm-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Clock, ArrowLeft, Users } from "lucide-react";
import DashboardBreadcrumb from "@/components/layout/dashboard-breadcrumb";
import type { CrmEvent, EventAttendance, EventAttendanceStatus } from "@/types/crm";

const statusConfig: Record<
  EventAttendanceStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  invited: { label: "Convidado", variant: "secondary" },
  confirmed: { label: "Confirmado", variant: "default" },
  declined: { label: "Recusou", variant: "destructive" },
  attended: { label: "Compareceu", variant: "outline" },
};

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<CrmEvent | null>(null);
  const [attendances, setAttendances] = useState<EventAttendance[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEvent = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [ev, atts] = await Promise.all([
        getEvent(id),
        getEventAttendances(id),
      ]);
      setEvent(ev);
      setAttendances(Array.isArray(atts) ? atts : []);
    } catch {
      toast.error("Erro ao carregar evento");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  const handleStatusChange = async (personId: string, status: string) => {
    if (!id) return;
    try {
      await updateAttendance(id, personId, status);
      setAttendances((prev) =>
        prev.map((a) =>
          a.person_id === personId
            ? { ...a, status: status as EventAttendanceStatus }
            : a
        )
      );
      toast.success("Status atualizado");
    } catch {
      toast.error("Erro ao atualizar status");
    }
  };

  if (loading) {
    return (
      <>
        <DashboardBreadcrumb title="CRM" text="Carregando..." />
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </>
    );
  }

  if (!event) {
    return (
      <>
        <DashboardBreadcrumb title="CRM" text="Não encontrado" />
        <div className="p-6 text-center py-20 text-muted-foreground">
          <p className="text-sm">Evento não encontrado.</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push("/crm/events")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Eventos
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardBreadcrumb title="CRM" text={event.title} />

      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/crm/events")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{event.title}</h1>
        </div>

        {/* Detalhes do evento */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {event.description && (
              <p className="text-sm text-muted-foreground">{event.description}</p>
            )}
            <div className="flex flex-wrap gap-6">
              <span className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Início:</span>
                {formatDate(event.starts_at)}
              </span>
              {event.ends_at && (
                <span className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Fim:</span>
                  {formatDate(event.ends_at)}
                </span>
              )}
              {event.location && (
                <span className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {event.location}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Participantes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Participantes
              {attendances.length > 0 && (
                <Badge variant="secondary">{attendances.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {attendances.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum participante adicionado ainda.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Status atual</TableHead>
                    <TableHead className="w-[180px]">Alterar status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendances.map((att) => (
                    <TableRow key={att.person_id}>
                      <TableCell className="font-medium">
                        {att.person_name ?? att.person_id}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            statusConfig[att.status as EventAttendanceStatus]?.variant ?? "secondary"
                          }
                        >
                          {statusConfig[att.status as EventAttendanceStatus]?.label ?? att.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          defaultValue={att.status}
                          onValueChange={(val) => handleStatusChange(att.person_id, val)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="invited">Convidado</SelectItem>
                            <SelectItem value="confirmed">Confirmado</SelectItem>
                            <SelectItem value="declined">Recusou</SelectItem>
                            <SelectItem value="attended">Compareceu</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
