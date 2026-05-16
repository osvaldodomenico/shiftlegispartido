"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getEvent, addAttendance, updateAttendance } from "@/services/crm-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { MapPin, Clock } from "lucide-react";
import type { CrmEvent, EventAttendanceStatus } from "@/types/crm";

// Mapeamento de status para badge visual
const statusConfig: Record<EventAttendanceStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  invited: { label: "Convidado", variant: "secondary" },
  confirmed: { label: "Confirmado", variant: "default" },
  declined: { label: "Recusou", variant: "destructive" },
  attended: { label: "Compareceu", variant: "outline" },
};

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<CrmEvent | null>(null);

  useEffect(() => {
    if (id) getEvent(id).then((e) => setEvent(e as any));
  }, [id]);

  const handleStatusChange = async (personId: string, status: string) => {
    if (!id) return;
    await updateAttendance(id, personId, status);
    // Recarrega evento para atualizar lista de participantes
    getEvent(id).then((e) => setEvent(e as any));
  };

  if (!event) {
    return (
      <div className="p-6 text-center text-muted-foreground">Carregando...</div>
    );
  }

  const attendances: any[] = (event as any).attendances ?? [];

  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho do evento */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">{event.title}</h1>
        {event.description && (
          <p className="text-muted-foreground">{event.description}</p>
        )}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {new Date(event.starts_at).toLocaleString("pt-BR")}
            {event.ends_at && ` — ${new Date(event.ends_at).toLocaleString("pt-BR")}`}
          </span>
          {event.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {event.location}
            </span>
          )}
        </div>
      </div>

      {/* Gestão de participantes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Participantes</h2>
          <Button size="sm" variant="outline">
            Adicionar Pessoa
          </Button>
        </div>

        {attendances.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum participante adicionado ainda.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[180px]">Alterar Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendances.map((att: any) => (
                <TableRow key={att.person_id}>
                  <TableCell className="font-medium">
                    {att.person?.name ?? att.person_id}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusConfig[att.status as EventAttendanceStatus]?.variant ?? "secondary"}>
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
      </div>
    </div>
  );
}
