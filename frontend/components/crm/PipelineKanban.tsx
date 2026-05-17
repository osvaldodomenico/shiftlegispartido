"use client";
import { useEffect, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDroppable,
} from "@dnd-kit/core";
import { PipelineCard } from "./PipelineCard";
import { MovePersonDialog } from "./MovePersonDialog";
import { useCrmStore } from "@/stores/crm-store";
import { getPipelineStages, getPipelineStageContacts } from "@/services/crm-api";
import type { CrmContact, PipelineStage } from "@/types/crm";

// ─── KanbanColumn ────────────────────────────────────────────────────────────
// Coluna droppable para cada estágio do pipeline
function KanbanColumn({
  stage,
  contacts,
}: {
  stage: PipelineStage;
  contacts: CrmContact[];
}) {
  const { isOver, setNodeRef } = useDroppable({ id: stage.id });

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-72 bg-muted/30 rounded-lg p-3 space-y-2 min-h-96 transition-all ${
        isOver ? "ring-2 ring-primary" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: stage.color ?? "#888" }}
          />
          <span className="font-medium text-sm">{stage.name}</span>
        </div>
        <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
          {contacts.length}
        </span>
      </div>
      {contacts.map((c) => (
        <PipelineCard key={c.id} contact={c} />
      ))}
      {contacts.length === 0 && (
        <div className="text-xs text-muted-foreground text-center pt-6">
          Nenhum contato
        </div>
      )}
    </div>
  );
}

// ─── PipelineKanban ──────────────────────────────────────────────────────────
// Board principal com DndContext + DragOverlay e confirmação de movimentação
export function PipelineKanban() {
  const { stages, setStages } = useCrmStore();
  const [columnContacts, setColumnContacts] = useState<Record<string, CrmContact[]>>({});
  const [previewContacts, setPreviewContacts] = useState<Record<string, CrmContact[]>>({});
  const [activeContact, setActiveContact] = useState<CrmContact | null>(null);
  const [moveState, setMoveState] = useState<{
    contact: CrmContact;
    fromStageId: string;
    toStageId: string;
    toStageName: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Carrega estágios e contatos de cada estágio ao montar
  useEffect(() => {
    setLoading(true);
    getPipelineStages()
      .then((s) => {
        const pipelineStages = s;
        setStages(Array.isArray(pipelineStages) ? pipelineStages : []);
        return Promise.all(
          pipelineStages.map((stage) =>
            getPipelineStageContacts(stage.id).then((contacts) => ({
              stageId: stage.id,
              contacts: contacts,
            }))
          )
        );
      })
      .then((results) => {
        const map: Record<string, CrmContact[]> = {};
        results.forEach(({ stageId, contacts }) => {
          map[stageId] = contacts;
        });
        setColumnContacts(map);
        setPreviewContacts(map);
      })
      .catch(() => {
        // Silencia erros de carregamento inicial; o usuário verá colunas vazias
      })
      .finally(() => setLoading(false));
  }, []);

  function handleDragStart(event: DragStartEvent) {
    setActiveContact(event.active.data.current?.contact ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || !activeContact) {
      setActiveContact(null);
      return;
    }

    const toStageId = over.id as string;
    const fromStageId = Object.keys(previewContacts).find((sid) =>
      previewContacts[sid].some((c) => c.id === active.id)
    );

    if (!fromStageId || fromStageId === toStageId) {
      setActiveContact(null);
      return;
    }

    // Atualização otimista: move o card visualmente antes da confirmação da API
    const next = { ...previewContacts };
    next[fromStageId] = next[fromStageId].filter((c) => c.id !== active.id);
    next[toStageId] = [...(next[toStageId] ?? []), activeContact];
    setPreviewContacts(next);

    const toStage = stages.find((s: PipelineStage) => s.id === toStageId);
    setMoveState({
      contact: activeContact,
      fromStageId,
      toStageId,
      toStageName: toStage?.name ?? "",
    });
    setActiveContact(null);
  }

  // Confirma movimentação: atualiza o estado canônico
  function handleMoveSuccess() {
    setColumnContacts(previewContacts);
    setMoveState(null);
  }

  // Cancela movimentação: reverte o estado de preview para o canônico
  function handleMoveCancel() {
    setPreviewContacts(columnContacts);
    setMoveState(null);
  }

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex-shrink-0 w-72 bg-muted/30 rounded-lg p-3 min-h-96 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (stages.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-12">
        Nenhum estágio de pipeline configurado.
      </div>
    );
  }

  return (
    <>
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {(stages as PipelineStage[]).map((stage) => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              contacts={previewContacts[stage.id] ?? []}
            />
          ))}
        </div>
        <DragOverlay>
          {activeContact ? <PipelineCard contact={activeContact} /> : null}
        </DragOverlay>
      </DndContext>

      {moveState && (
        <MovePersonDialog
          open
          contactName={moveState.contact.name}
          contactId={moveState.contact.id}
          fromStage={
            (stages as PipelineStage[]).find((s) => s.id === moveState.fromStageId)?.name ?? ""
          }
          toStageId={moveState.toStageId}
          toStageName={moveState.toStageName}
          onSuccess={handleMoveSuccess}
          onCancel={handleMoveCancel}
        />
      )}
    </>
  );
}
