"use client";

import { ContactTimeline } from "@/components/crm/contact-timeline";
import { ContactTasks } from "@/components/crm/contact-tasks";
import DashboardBreadcrumb from "@/components/layout/dashboard-breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as crmApi from "@/services/crm-api";
import type {
  CrmContact,
  CrmEvent,
  CrmTag,
  Interaction,
  CrmTask,
  PersonType,
  PipelineStage,
} from "@/types/crm";
import {
  ArrowLeft,
  Calendar,
  CheckSquare,
  Loader2,
  MoveRight,
  Tag,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";

// ------- Labels -------

const TYPE_LABELS: Record<PersonType, string> = {
  filiado: "Filiado",
  fornecedor: "Fornecedor",
  funcionario: "Funcionário",
  candidato: "Candidato",
  doador: "Doador",
  voluntario: "Voluntário",
};

const TYPE_COLORS: Record<PersonType, string> = {
  filiado: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  fornecedor: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  funcionario: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  candidato: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  doador: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  voluntario: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
};

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ------- Move Pipeline Dialog -------

interface MovePipelineDialogProps {
  personId: string;
  stages: PipelineStage[];
  currentStageId?: string;
  onMoved: () => void;
}

function MovePipelineDialog({ personId, stages, currentStageId, onMoved }: MovePipelineDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState(currentStageId ?? "");
  const [loading, setLoading] = useState(false);

  async function handleMove() {
    if (!selectedStage || selectedStage === currentStageId) return;
    setLoading(true);
    try {
      await crmApi.movePerson(personId, selectedStage);
      setOpen(false);
      onMoved();
    } catch {
      // silencia
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1">
          <MoveRight className="w-4 h-4" />
          Mover etapa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Mover no pipeline</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Select value={selectedStage} onValueChange={setSelectedStage}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a etapa..." />
            </SelectTrigger>
            <SelectContent>
              {stages.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleMove} disabled={loading || !selectedStage || selectedStage === currentStageId}>
              {loading ? "Movendo..." : "Mover"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ------- Manage Tags Dialog -------

interface ManageTagsDialogProps {
  personId: string;
  allTags: CrmTag[];
  personTags: CrmTag[];
  onChanged: () => void;
}

function ManageTagsDialog({ personId, allTags, personTags, onChanged }: ManageTagsDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const personTagIds = new Set(personTags.map((t) => t.id));

  async function handleAdd(tagId: string) {
    setLoading(tagId);
    try {
      await crmApi.addPersonTag(personId, tagId);
      onChanged();
    } catch {
      // silencia
    } finally {
      setLoading(null);
    }
  }

  async function handleRemove(tagId: string) {
    setLoading(tagId);
    try {
      await crmApi.removePersonTag(personId, tagId);
      onChanged();
    } catch {
      // silencia
    } finally {
      setLoading(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1">
          <Tag className="w-4 h-4" />
          Gerenciar tags
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Tags do contato</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {allTags.length === 0 && (
            <p className="text-sm text-neutral-500 text-center py-4">Nenhuma tag cadastrada.</p>
          )}
          {allTags.map((tag) => {
            const active = personTagIds.has(tag.id);
            return (
              <div
                key={tag.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg border border-neutral-200 dark:border-slate-600"
              >
                <span
                  className="text-sm font-medium px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${tag.color}22`, color: tag.color }}
                >
                  {tag.name}
                </span>
                <Button
                  size="sm"
                  variant={active ? "destructive" : "secondary"}
                  className="h-7 text-xs"
                  disabled={loading === tag.id}
                  onClick={() => active ? handleRemove(tag.id) : handleAdd(tag.id)}
                >
                  {loading === tag.id ? <Loader2 className="w-3 h-3 animate-spin" /> : active ? "Remover" : "Adicionar"}
                </Button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ------- Events Tab -------

function EventsTab({ events }: { events: CrmEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-neutral-500 dark:text-neutral-400 py-8 text-center">
        Nenhum evento vinculado a este contato.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div
          key={event.id}
          className="flex items-start gap-3 p-4 rounded-lg border border-neutral-200 dark:border-slate-600"
        >
          <Calendar className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-sm text-neutral-800 dark:text-neutral-200">{event.title}</p>
            {event.description && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{event.description}</p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
              <span className="text-xs text-neutral-400">
                Início: {formatDate(event.starts_at)}
              </span>
              {event.location && (
                <span className="text-xs text-neutral-400">Local: {event.location}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ------- Main Page -------

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ContactProfilePage({ params }: PageProps) {
  const { id } = use(params);

  const [contact, setContact] = useState<CrmContact | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [tasks, setTasks] = useState<CrmTask[]>([]);
  const [events, setEvents] = useState<CrmEvent[]>([]);
  const [personTags, setPersonTags] = useState<CrmTag[]>([]);
  const [allTags, setAllTags] = useState<CrmTag[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContact = useCallback(async () => {
    try {
      // Busca o contato via lista filtrada por id — API de people
      const data = await crmApi.getContacts({ search: id });
      const list = Array.isArray(data) ? data : [];
      // Tenta encontrar pelo id exato
      const found = list.find((c) => c.id === id) ?? list[0] ?? null;
      setContact(found);
    } catch {
      setError("Não foi possível carregar o contato.");
    }
  }, [id]);

  const fetchInteractions = useCallback(async () => {
    try {
      const data = await crmApi.getPersonInteractions(id);
      setInteractions(Array.isArray(data) ? data : []);
    } catch {
      setInteractions([]);
    }
  }, [id]);

  const fetchTasks = useCallback(async () => {
    try {
      const data = await crmApi.getPersonTasks(id);
      setTasks(Array.isArray(data) ? data : []);
    } catch {
      setTasks([]);
    }
  }, [id]);

  const fetchEvents = useCallback(async () => {
    try {
      const data = await crmApi.getPersonEvents(id);
      setEvents(Array.isArray(data) ? data : []);
    } catch {
      setEvents([]);
    }
  }, [id]);

  const fetchPersonTags = useCallback(async () => {
    try {
      const data = await crmApi.getPersonTags(id);
      setPersonTags(Array.isArray(data) ? data : []);
    } catch {
      setPersonTags([]);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchContact(),
      fetchInteractions(),
      fetchTasks(),
      fetchEvents(),
      fetchPersonTags(),
      crmApi.getPipelineStages().then((s) => {
        setStages(Array.isArray(s) ? s : []);
      }).catch(() => {}),
      crmApi.getTags().then((t) => {
        setAllTags(Array.isArray(t) ? t : []);
      }).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [fetchContact, fetchInteractions, fetchTasks, fetchEvents, fetchPersonTags]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-neutral-500">
        <X className="w-12 h-12 opacity-30" />
        <p>{error ?? "Contato não encontrado."}</p>
        <Button variant="outline" asChild>
          <Link href="/crm/contacts">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para contatos
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <DashboardBreadcrumb title={contact.name} text="Perfil do contato" />

      <div className="flex flex-col gap-6">
        {/* Header do perfil */}
        <Card className="border-0">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-5">
              {/* Avatar com inicial */}
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="w-8 h-8 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h2 className="text-xl font-bold text-neutral-800 dark:text-white leading-tight">
                    {contact.name}
                  </h2>
                  <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[contact.type]}`}>
                    {TYPE_LABELS[contact.type]}
                  </span>
                </div>

                {/* Etapa do pipeline */}
                {contact.stage && (
                  <div className="mb-3">
                    <span
                      className="inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium border"
                      style={{
                        borderColor: contact.stage.color,
                        color: contact.stage.color,
                        backgroundColor: `${contact.stage.color}18`,
                      }}
                    >
                      Pipeline: {contact.stage.name}
                    </span>
                  </div>
                )}

                {/* Tags do contato */}
                {personTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {personTags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="secondary"
                        className="text-xs"
                        style={{ backgroundColor: `${tag.color}22`, color: tag.color }}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Metadados */}
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-neutral-500 dark:text-neutral-400">
                  <span>Criado em: {formatDate(contact.created_at)}</span>
                  {contact.last_interaction_at && (
                    <span>Última interação: {formatDate(contact.last_interaction_at)}</span>
                  )}
                  {contact.task_count !== undefined && (
                    <span className="flex items-center gap-1">
                      <CheckSquare className="w-3.5 h-3.5" />
                      {contact.task_count} tarefa{contact.task_count !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>

              {/* Ações */}
              <div className="flex flex-wrap gap-2 shrink-0">
                <MovePipelineDialog
                  personId={contact.id}
                  stages={stages}
                  currentStageId={contact.stage?.id}
                  onMoved={() => { fetchContact(); }}
                />
                <ManageTagsDialog
                  personId={contact.id}
                  allTags={allTags}
                  personTags={personTags}
                  onChanged={fetchPersonTags}
                />
                <Button size="sm" variant="outline" asChild>
                  <Link href="/crm/contacts">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Voltar
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs: Interações / Tarefas / Eventos */}
        <Tabs defaultValue="interactions">
          <TabsList className="mb-4">
            <TabsTrigger value="interactions" className="gap-1.5">
              Interações
              {interactions.length > 0 && (
                <Badge variant="secondary" className="text-xs h-4 min-w-4 px-1">{interactions.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-1.5">
              Tarefas
              {tasks.length > 0 && (
                <Badge variant="secondary" className="text-xs h-4 min-w-4 px-1">{tasks.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-1.5">
              Eventos
              {events.length > 0 && (
                <Badge variant="secondary" className="text-xs h-4 min-w-4 px-1">{events.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="interactions">
            <ContactTimeline
              personId={contact.id}
              interactions={interactions}
              onRefresh={fetchInteractions}
            />
          </TabsContent>

          <TabsContent value="tasks">
            <ContactTasks
              personId={contact.id}
              tasks={tasks}
              onRefresh={fetchTasks}
            />
          </TabsContent>

          <TabsContent value="events">
            <Card className="border-0">
              <CardHeader className="flex flex-row items-center gap-2 pb-3 border-b border-neutral-200 dark:border-slate-600 font-semibold text-base">
                <Calendar className="w-4 h-4 text-primary" />
                Eventos
              </CardHeader>
              <CardContent className="p-4">
                <EventsTab events={events} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
