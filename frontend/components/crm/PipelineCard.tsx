"use client";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import type { CrmContact } from "@/types/crm";

interface Props {
  contact: CrmContact;
}

export function PipelineCard({ contact }: Props) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: contact.id,
    data: { contact },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="bg-card border rounded-lg p-3 shadow-sm cursor-grab active:cursor-grabbing space-y-2"
      onClick={() => router.push(`/crm/contacts/${contact.id}`)}
    >
      <div className="font-medium text-sm">{contact.name}</div>
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className="text-xs">{contact.type}</Badge>
        {contact.task_count ? (
          <Badge variant="secondary" className="text-xs">{contact.task_count} tarefas</Badge>
        ) : null}
      </div>
      {contact.last_interaction_at && (
        <div className="text-xs text-muted-foreground">
          Última interação: {format(new Date(contact.last_interaction_at), "dd/MM")}
        </div>
      )}
    </div>
  );
}
