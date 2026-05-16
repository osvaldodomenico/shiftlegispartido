"use client";

import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reorderStages } from "@/services/crm-api";
import toast from "react-hot-toast";
import type { PipelineStage } from "@/types/crm";

interface Props {
  stages: PipelineStage[];
  onStagesChange: (stages: PipelineStage[]) => void;
  onEdit: (stage: PipelineStage) => void;
  onDelete: (id: string) => void;
}

function SortableStageRow({
  stage,
  onEdit,
  onDelete,
}: {
  stage: PipelineStage;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: stage.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 border rounded-lg bg-card"
    >
      <button {...listeners} {...attributes} className="cursor-grab touch-none">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <div
        className="w-4 h-4 rounded-full flex-shrink-0"
        style={{ backgroundColor: stage.color }}
      />
      <span className="flex-1 font-medium">{stage.name}</span>
      {stage.is_default && (
        <span className="text-xs text-muted-foreground">Padrão</span>
      )}
      <Button variant="ghost" size="icon" onClick={onEdit}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onDelete}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

export function StageSortable({
  stages,
  onStagesChange,
  onEdit,
  onDelete,
}: Props) {
  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = stages.findIndex((s) => s.id === active.id);
    const newIndex = stages.findIndex((s) => s.id === over.id);
    const newStages = arrayMove(stages, oldIndex, newIndex);

    // Atualização otimista antes da chamada à API
    onStagesChange(newStages);

    try {
      await reorderStages(newStages.map((s) => s.id));
      toast.success("Ordem salva");
    } catch {
      // Rollback em caso de falha
      toast.error("Erro ao salvar ordem");
      onStagesChange(stages);
    }
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={stages.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {stages.map((s) => (
            <SortableStageRow
              key={s.id}
              stage={s}
              onEdit={() => onEdit(s)}
              onDelete={() => onDelete(s.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
