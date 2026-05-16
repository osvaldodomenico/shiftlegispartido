# Web Frontend — Sistema Completo ShiftPartido

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement all CRM, Electoral, Party and Mandates pages in the Next.js dashboard using existing shadcn/ui components and Zustand state management.

**Architecture:** App Router with (dashboard) layout group. Each domain (crm, electoral, party, mandates) gets its own Zustand store and API service file. Shared components in components/crm/, components/electoral/, etc.

**Tech Stack:** Next.js 15.5 App Router, shadcn/ui, Radix UI, Zustand, Zod, React Hook Form, Axios, @dnd-kit (install), papaparse (install), FullCalendar (already installed), date-fns, Tailwind v4

**Prerequisite:** Backend plans 1, 2, and 3 must be complete and API running.

---

## Chunk 1: Install Missing Dependencies + API Layer Setup

### Goal
Install @dnd-kit and papaparse, then build the complete typed API layer and Zustand stores for all domains.

### Steps

- [ ] Install missing dependencies:
  ```bash
  cd frontend
  npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities papaparse @types/papaparse
  ```

- [ ] Create `frontend/services/api.ts` — Axios instance with base URL from `NEXT_PUBLIC_API_URL`, request interceptor that attaches `Authorization: Bearer <token>` from next-auth session, response interceptor that handles 401 (redirect to /auth/signin) and unwraps `{ success, data }` envelope:
  ```ts
  import axios from "axios";
  import { getSession } from "next-auth/react";

  const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
  });

  api.interceptors.request.use(async (config) => {
    const session = await getSession();
    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }
    return config;
  });

  api.interceptors.response.use(
    (res) => res.data?.data ?? res.data,
    (err) => {
      if (err.response?.status === 401 && typeof window !== "undefined") {
        window.location.href = "/auth/signin";
      }
      return Promise.reject(err.response?.data ?? err);
    }
  );

  export default api;
  ```

- [ ] Create `frontend/types/crm.ts` with TypeScript interfaces:
  ```ts
  export type PersonType = "filiado" | "fornecedor" | "funcionario" | "candidato" | "doador" | "voluntario";
  export type InteractionType = "ligacao" | "whatsapp" | "reuniao" | "email" | "outro";
  export type InteractionDirection = "inbound" | "outbound";
  export type TaskStatus = "pending" | "in_progress" | "done" | "cancelled";
  export type TaskPriority = "low" | "medium" | "high";
  export type NotificationType = "task_due" | "task_assigned" | "pipeline_moved" | "event_reminder";
  export type EventAttendanceStatus = "invited" | "confirmed" | "declined" | "attended";
  export type ImportStatus = "pending" | "processing" | "done" | "error";

  export interface CrmTag {
    id: string;
    name: string;
    color: string;
    tenant_id: string;
  }

  export interface PipelineStage {
    id: string;
    name: string;
    color: string;
    order: number;
    is_default: boolean;
    tenant_id: string;
  }

  export interface CrmContact {
    id: string;
    name: string;
    type: PersonType;
    stage?: PipelineStage;
    tags: CrmTag[];
    last_interaction_at?: string;
    task_count?: number;
    created_at: string;
  }

  export interface Interaction {
    id: string;
    person_id: string;
    type: InteractionType;
    direction: InteractionDirection;
    notes?: string;
    occurred_at: string;
    created_by: { id: string; name: string };
  }

  export interface CrmTask {
    id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    due_at?: string;
    assigned_to?: { id: string; name: string };
    person?: { id: string; name: string };
    created_at: string;
  }

  export interface CrmNotification {
    id: string;
    type: NotificationType;
    message: string;
    read: boolean;
    created_at: string;
    entity_type?: string;
    entity_id?: string;
  }

  export interface CrmEvent {
    id: string;
    title: string;
    description?: string;
    starts_at: string;
    ends_at: string;
    location?: string;
    created_by: { id: string; name: string };
    attendance_count?: number;
  }

  export interface EventAttendance {
    person_id: string;
    person_name: string;
    status: EventAttendanceStatus;
  }

  export interface CrmImport {
    id: string;
    status: ImportStatus;
    total_rows: number;
    imported_rows: number;
    error_rows: number;
    created_at: string;
  }

  export interface CrmKpis {
    total_contacts: number;
    new_contacts_this_month: number;
    open_tasks: number;
    overdue_tasks: number;
    interactions_this_week: number;
    upcoming_events: number;
  }

  export interface PipelineFunnel {
    stage_id: string;
    stage_name: string;
    stage_color: string;
    count: number;
  }
  ```

- [ ] Create `frontend/types/electoral.ts`:
  ```ts
  export type CampaignStatus = "planning" | "active" | "finished";
  export type TeamMemberRole = "coordenador" | "cabo_eleitoral" | "voluntario" | "assessor";
  export type TeamMemberPaymentType = "paid" | "volunteer";
  export type ContractStatus = "draft" | "active" | "finished" | "cancelled";
  export type ScheduleEventType = "corpo_a_corpo" | "comicio" | "debate" | "reuniao" | "outro";
  export type ScheduleEventStatus = "scheduled" | "done" | "cancelled";
  export type TseReportType = "receita" | "despesa";
  export type TseReportStatus = "draft" | "submitted" | "accepted" | "rejected";

  export interface Election {
    id: string;
    name: string;
    election_date: string;
    runoff_date?: string;
    tenant_id: string;
  }

  export interface Campaign {
    id: string;
    name: string;
    election: Election;
    candidate: { id: string; name: string };
    status: CampaignStatus;
    budget_limit?: number;
    total_spent?: number;
    created_at: string;
  }

  export interface TeamMember {
    id: string;
    person: { id: string; name: string };
    role: TeamMemberRole;
    payment_type: TeamMemberPaymentType;
    salary?: number;
    joined_at: string;
  }

  export interface CampaignContract {
    id: string;
    supplier: { id: string; name: string };
    description: string;
    value: number;
    status: ContractStatus;
    signed_at?: string;
  }

  export interface ScheduleEvent {
    id: string;
    title: string;
    type: ScheduleEventType;
    status: ScheduleEventStatus;
    starts_at: string;
    ends_at?: string;
    location?: string;
    notes?: string;
  }

  export interface TseReport {
    id: string;
    campaign_id: string;
    type: TseReportType;
    status: TseReportStatus;
    period_start: string;
    period_end: string;
    is_final: boolean;
    submitted_at?: string;
  }

  export interface TseCode {
    id: string;
    code: string;
    description: string;
    type: TseReportType;
  }

  export interface TseReportItem {
    id: string;
    tse_code: TseCode;
    description: string;
    amount: number;
    date: string;
  }
  ```

- [ ] Create `frontend/types/party.ts`:
  ```ts
  export type ChapterLevel = "nacional" | "estadual" | "municipal" | "zonal";
  export type MandateStatus = "active" | "inactive" | "suspended";

  export interface PartyChapter {
    id: string;
    name: string;
    level: ChapterLevel;
    parent_id?: string;
    children?: PartyChapter[];
    member_count?: number;
    state?: string;
    city?: string;
  }

  export interface ChapterMember {
    id: string;
    person: { id: string; name: string };
    role?: string;
    joined_at: string;
  }

  export interface PartyOrgan {
    id: string;
    name: string;
    description?: string;
    member_count?: number;
  }

  export interface OrganMember {
    id: string;
    person: { id: string; name: string };
    role?: string;
    joined_at: string;
  }

  export interface Mandate {
    id: string;
    person: { id: string; name: string };
    office: string;
    jurisdiction: string;
    start_date: string;
    end_date?: string;
    status: MandateStatus;
  }
  ```

- [ ] Create `frontend/services/crm-api.ts` with typed functions for all CRM endpoints:
  ```ts
  import api from "./api";
  import type { CrmTag, PipelineStage, CrmContact, Interaction, CrmTask,
    CrmNotification, CrmEvent, EventAttendance, CrmImport, CrmKpis, PipelineFunnel } from "@/types/crm";

  // Tags
  export const getTags = () => api.get<CrmTag[]>("/tags");
  export const createTag = (data: { name: string; color: string }) => api.post<CrmTag>("/tags", data);
  export const updateTag = (id: string, data: Partial<{ name: string; color: string }>) => api.patch<CrmTag>(`/tags/${id}`, data);
  export const deleteTag = (id: string) => api.delete(`/tags/${id}`);
  export const addPersonTag = (personId: string, tagId: string) => api.post(`/people/${personId}/tags`, { tagId });
  export const removePersonTag = (personId: string, tagId: string) => api.delete(`/people/${personId}/tags/${tagId}`);

  // Pipeline
  export const getPipelineStages = () => api.get<PipelineStage[]>("/pipeline/stages");
  export const createStage = (data: { name: string; color: string }) => api.post<PipelineStage>("/pipeline/stages", data);
  export const updateStage = (id: string, data: Partial<{ name: string; color: string }>) => api.patch<PipelineStage>(`/pipeline/stages/${id}`, data);
  export const deleteStage = (id: string) => api.delete(`/pipeline/stages/${id}`);
  export const reorderStages = (orderedIds: string[]) => api.patch("/pipeline/stages/reorder", { orderedIds });
  export const movePerson = (personId: string, stageId: string, notes?: string) =>
    api.post("/pipeline/move", { personId, stageId, notes });
  export const getPipelineStageContacts = (stageId: string) =>
    api.get<CrmContact[]>(`/pipeline/stage/${stageId}/people`);

  // Contacts (people with CRM filters)
  export const getContacts = (params?: { stage?: string; tag?: string; type?: string; search?: string }) =>
    api.get<CrmContact[]>("/people", { params });
  export const getPersonInteractions = (personId: string) =>
    api.get<Interaction[]>(`/people/${personId}/interactions`);
  export const getPersonTasks = (personId: string) =>
    api.get<CrmTask[]>(`/people/${personId}/tasks`);
  export const getPersonPipelineHistory = (personId: string) =>
    api.get(`/people/${personId}/pipeline-history`);
  export const getPersonEvents = (personId: string) =>
    api.get<CrmEvent[]>(`/people/${personId}/events`);
  export const getPersonTags = (personId: string) =>
    api.get<CrmTag[]>(`/people/${personId}/tags`);

  // Interactions
  export const createInteraction = (data: {
    person_id: string; type: string; direction: string; notes?: string; occurred_at: string;
  }) => api.post<Interaction>("/interactions", data);
  export const deleteInteraction = (id: string) => api.delete(`/interactions/${id}`);

  // Tasks
  export const getTasks = (params?: { assignedTo?: string; status?: string; due?: string; personId?: string }) =>
    api.get<CrmTask[]>("/tasks", { params });
  export const createTask = (data: {
    title: string; description?: string; priority: string; due_at?: string;
    assigned_to_id?: string; person_id?: string;
  }) => api.post<CrmTask>("/tasks", data);
  export const updateTask = (id: string, data: Partial<CrmTask>) => api.patch<CrmTask>(`/tasks/${id}`, data);
  export const completeTask = (id: string) => api.patch(`/tasks/${id}/complete`);
  export const deleteTask = (id: string) => api.delete(`/tasks/${id}`);

  // Notifications
  export const getNotifications = () => api.get<CrmNotification[]>("/notifications");
  export const getUnreadCount = () => api.get<{ count: number }>("/notifications/unread-count");
  export const markRead = (id: string) => api.patch(`/notifications/${id}/read`);
  export const markAllRead = () => api.patch("/notifications/read-all");

  // Events
  export const getEvents = () => api.get<CrmEvent[]>("/events");
  export const getEvent = (id: string) => api.get<CrmEvent>(`/events/${id}`);
  export const createEvent = (data: Partial<CrmEvent>) => api.post<CrmEvent>("/events", data);
  export const updateEvent = (id: string, data: Partial<CrmEvent>) => api.patch<CrmEvent>(`/events/${id}`, data);
  export const deleteEvent = (id: string) => api.delete(`/events/${id}`);
  export const getEventAttendances = (id: string) => api.get<EventAttendance[]>(`/events/${id}/attendances`);
  export const addAttendance = (id: string, personId: string) =>
    api.post(`/events/${id}/attendances`, { personId });
  export const updateAttendance = (eventId: string, personId: string, status: string) =>
    api.patch(`/events/${eventId}/attendances/${personId}`, { status });

  // Import
  export const uploadCsv = (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post<CrmImport>("/crm/import/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  };
  export const getImportStatus = (id: string) => api.get<CrmImport>(`/crm/import/${id}/status`);
  export const getImportErrors = (id: string) => api.get(`/crm/import/${id}/errors`);
  export const getImportHistory = () => api.get<CrmImport[]>("/crm/import/history");

  // Dashboard
  export const getDashboardKpis = () => api.get<CrmKpis>("/crm/dashboard/kpis");
  export const getPipelineFunnel = () => api.get<PipelineFunnel[]>("/crm/dashboard/pipeline-funnel");
  export const getTasksSummary = () => api.get("/crm/dashboard/tasks-summary");
  ```

- [ ] Create `frontend/services/electoral-api.ts`:
  ```ts
  import api from "./api";
  import type { Election, Campaign, TeamMember, CampaignContract,
    ScheduleEvent, TseReport, TseCode, TseReportItem } from "@/types/electoral";

  // Elections
  export const getElections = () => api.get<Election[]>("/electoral/elections");
  export const getElection = (id: string) => api.get<Election>(`/electoral/elections/${id}`);
  export const createElection = (data: Partial<Election>) => api.post<Election>("/electoral/elections", data);
  export const updateElection = (id: string, data: Partial<Election>) =>
    api.patch<Election>(`/electoral/elections/${id}`, data);

  // Campaigns
  export const getCampaigns = () => api.get<Campaign[]>("/electoral/campaigns");
  export const getCampaign = (id: string) => api.get<Campaign>(`/electoral/campaigns/${id}`);
  export const createCampaign = (data: Partial<Campaign>) => api.post<Campaign>("/electoral/campaigns", data);
  export const updateCampaign = (id: string, data: Partial<Campaign>) =>
    api.patch<Campaign>(`/electoral/campaigns/${id}`, data);

  // Team
  export const getCampaignTeam = (id: string) => api.get<TeamMember[]>(`/electoral/campaigns/${id}/team`);
  export const addTeamMember = (id: string, data: Partial<TeamMember>) =>
    api.post<TeamMember>(`/electoral/campaigns/${id}/team`, data);
  export const updateTeamMember = (campaignId: string, memberId: string, data: Partial<TeamMember>) =>
    api.patch<TeamMember>(`/electoral/campaigns/${campaignId}/team/${memberId}`, data);

  // Contracts
  export const getContracts = (id: string) => api.get<CampaignContract[]>(`/electoral/campaigns/${id}/contracts`);
  export const createContract = (id: string, data: Partial<CampaignContract>) =>
    api.post<CampaignContract>(`/electoral/campaigns/${id}/contracts`, data);

  // Schedule
  export const getSchedule = (id: string) => api.get<ScheduleEvent[]>(`/electoral/campaigns/${id}/schedule`);
  export const createScheduleEvent = (id: string, data: Partial<ScheduleEvent>) =>
    api.post<ScheduleEvent>(`/electoral/campaigns/${id}/schedule`, data);
  export const updateScheduleEvent = (campaignId: string, eventId: string, data: Partial<ScheduleEvent>) =>
    api.patch<ScheduleEvent>(`/electoral/campaigns/${campaignId}/schedule/${eventId}`, data);

  // TSE Reports
  export const getTseReports = (campaignId: string) =>
    api.get<TseReport[]>(`/electoral/campaigns/${campaignId}/tse`);
  export const getTseReport = (campaignId: string, reportId: string) =>
    api.get<TseReport>(`/electoral/campaigns/${campaignId}/tse/${reportId}`);
  export const createTseReport = (campaignId: string, data: Partial<TseReport>) =>
    api.post<TseReport>(`/electoral/campaigns/${campaignId}/tse`, data);
  export const submitTseReport = (campaignId: string, reportId: string) =>
    api.post(`/electoral/campaigns/${campaignId}/tse/${reportId}/submit`);
  export const getTseReportItems = (campaignId: string, reportId: string) =>
    api.get<TseReportItem[]>(`/electoral/campaigns/${campaignId}/tse/${reportId}/items`);
  export const addTseReportItem = (campaignId: string, reportId: string, data: Partial<TseReportItem>) =>
    api.post<TseReportItem>(`/electoral/campaigns/${campaignId}/tse/${reportId}/items`, data);
  export const getTseCodes = () => api.get<TseCode[]>("/electoral/tse-codes");
  ```

- [ ] Create `frontend/services/party-api.ts`:
  ```ts
  import api from "./api";
  import type { PartyChapter, ChapterMember, PartyOrgan, OrganMember, Mandate } from "@/types/party";

  // Chapters
  export const getChapters = () => api.get<PartyChapter[]>("/party/chapters");
  export const getChapter = (id: string) => api.get<PartyChapter>(`/party/chapters/${id}`);
  export const createChapter = (data: Partial<PartyChapter>) => api.post<PartyChapter>("/party/chapters", data);
  export const updateChapter = (id: string, data: Partial<PartyChapter>) =>
    api.patch<PartyChapter>(`/party/chapters/${id}`, data);
  export const deleteChapter = (id: string) => api.delete(`/party/chapters/${id}`);
  export const getChapterMembers = (id: string) => api.get<ChapterMember[]>(`/party/chapters/${id}/members`);
  export const addChapterMember = (id: string, personId: string, role?: string) =>
    api.post(`/party/chapters/${id}/members`, { personId, role });
  export const removeChapterMember = (chapterId: string, memberId: string) =>
    api.delete(`/party/chapters/${chapterId}/members/${memberId}`);

  // Organs
  export const getOrgans = () => api.get<PartyOrgan[]>("/party/organs");
  export const createOrgan = (data: Partial<PartyOrgan>) => api.post<PartyOrgan>("/party/organs", data);
  export const updateOrgan = (id: string, data: Partial<PartyOrgan>) =>
    api.patch<PartyOrgan>(`/party/organs/${id}`, data);
  export const deleteOrgan = (id: string) => api.delete(`/party/organs/${id}`);
  export const getOrganMembers = (id: string) => api.get<OrganMember[]>(`/party/organs/${id}/members`);
  export const addOrganMember = (id: string, personId: string, role?: string) =>
    api.post(`/party/organs/${id}/members`, { personId, role });
  export const updateOrganMember = (organId: string, memberId: string, data: Partial<OrganMember>) =>
    api.patch<OrganMember>(`/party/organs/${organId}/members/${memberId}`, data);

  // Mandates
  export const getMandates = (params?: { personId?: string }) =>
    api.get<Mandate[]>("/mandates", { params });
  export const getMandate = (id: string) => api.get<Mandate>(`/mandates/${id}`);
  export const createMandate = (data: Partial<Mandate>) => api.post<Mandate>("/mandates", data);
  export const updateMandate = (id: string, data: Partial<Mandate>) =>
    api.patch<Mandate>(`/mandates/${id}`, data);
  export const deleteMandate = (id: string) => api.delete(`/mandates/${id}`);
  ```

- [ ] Create `frontend/stores/crm-store.ts`:
  ```ts
  import { create } from "zustand";
  import type { CrmTag, PipelineStage, CrmContact, CrmTask, CrmNotification, CrmKpis } from "@/types/crm";

  interface CrmState {
    tags: CrmTag[];
    stages: PipelineStage[];
    contacts: CrmContact[];
    tasks: CrmTask[];
    notifications: CrmNotification[];
    unreadCount: number;
    kpis: CrmKpis | null;
    isLoading: boolean;
    setTags: (tags: CrmTag[]) => void;
    setStages: (stages: PipelineStage[]) => void;
    setContacts: (contacts: CrmContact[]) => void;
    setTasks: (tasks: CrmTask[]) => void;
    setNotifications: (notifications: CrmNotification[]) => void;
    setUnreadCount: (count: number) => void;
    setKpis: (kpis: CrmKpis) => void;
    setLoading: (loading: boolean) => void;
    updateContactStage: (contactId: string, stage: PipelineStage) => void;
  }

  export const useCrmStore = create<CrmState>((set) => ({
    tags: [],
    stages: [],
    contacts: [],
    tasks: [],
    notifications: [],
    unreadCount: 0,
    kpis: null,
    isLoading: false,
    setTags: (tags) => set({ tags }),
    setStages: (stages) => set({ stages }),
    setContacts: (contacts) => set({ contacts }),
    setTasks: (tasks) => set({ tasks }),
    setNotifications: (notifications) => set({ notifications }),
    setUnreadCount: (unreadCount) => set({ unreadCount }),
    setKpis: (kpis) => set({ kpis }),
    setLoading: (isLoading) => set({ isLoading }),
    updateContactStage: (contactId, stage) =>
      set((state) => ({
        contacts: state.contacts.map((c) =>
          c.id === contactId ? { ...c, stage } : c
        ),
      })),
  }));
  ```

- [ ] Create `frontend/stores/electoral-store.ts`:
  ```ts
  import { create } from "zustand";
  import type { Election, Campaign } from "@/types/electoral";

  interface ElectoralState {
    elections: Election[];
    campaigns: Campaign[];
    selectedCampaign: Campaign | null;
    isLoading: boolean;
    setElections: (elections: Election[]) => void;
    setCampaigns: (campaigns: Campaign[]) => void;
    setSelectedCampaign: (campaign: Campaign | null) => void;
    setLoading: (loading: boolean) => void;
  }

  export const useElectoralStore = create<ElectoralState>((set) => ({
    elections: [],
    campaigns: [],
    selectedCampaign: null,
    isLoading: false,
    setElections: (elections) => set({ elections }),
    setCampaigns: (campaigns) => set({ campaigns }),
    setSelectedCampaign: (selectedCampaign) => set({ selectedCampaign }),
    setLoading: (isLoading) => set({ isLoading }),
  }));
  ```

- [ ] Create `frontend/stores/party-store.ts`:
  ```ts
  import { create } from "zustand";
  import type { PartyChapter, PartyOrgan, Mandate } from "@/types/party";

  interface PartyState {
    chapters: PartyChapter[];
    organs: PartyOrgan[];
    mandates: Mandate[];
    isLoading: boolean;
    setChapters: (chapters: PartyChapter[]) => void;
    setOrgans: (organs: PartyOrgan[]) => void;
    setMandates: (mandates: Mandate[]) => void;
    setLoading: (loading: boolean) => void;
  }

  export const usePartyStore = create<PartyState>((set) => ({
    chapters: [],
    organs: [],
    mandates: [],
    isLoading: false,
    setChapters: (chapters) => set({ chapters }),
    setOrgans: (organs) => set({ organs }),
    setMandates: (mandates) => set({ mandates }),
    setLoading: (isLoading) => set({ isLoading }),
  }));
  ```

- [ ] Git commit: `feat(frontend): install dnd-kit + papaparse, add API services, Zustand stores, TypeScript types for all domains`

---

## Chunk 2: CRM — Contacts Pages

### Goal
Build the contacts list with filters and the full contact profile page with tabbed layout.

### Steps

- [ ] Create `frontend/components/crm/ContactFilters.tsx` — filter bar with Select components for `type` (PersonType enum), `stage` (loaded from store), `tag` (loaded from store), and a text search Input. Emits `onChange(filters)` callback:
  ```tsx
  "use client";
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
  import { Input } from "@/components/ui/input";
  import { useCrmStore } from "@/stores/crm-store";

  interface Filters {
    search: string;
    type: string;
    stage: string;
    tag: string;
  }

  interface Props {
    filters: Filters;
    onChange: (filters: Filters) => void;
  }

  const PERSON_TYPES = [
    { value: "filiado", label: "Filiado" },
    { value: "fornecedor", label: "Fornecedor" },
    { value: "funcionario", label: "Funcionário" },
    { value: "candidato", label: "Candidato" },
    { value: "doador", label: "Doador" },
    { value: "voluntario", label: "Voluntário" },
  ];

  export function ContactFilters({ filters, onChange }: Props) {
    const { stages, tags } = useCrmStore();

    return (
      <div className="flex flex-wrap gap-3 items-center">
        <Input
          placeholder="Buscar contato..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="w-64"
        />
        <Select value={filters.type} onValueChange={(v) => onChange({ ...filters, type: v })}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos os tipos</SelectItem>
            {PERSON_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.stage} onValueChange={(v) => onChange({ ...filters, stage: v })}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Etapa" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas as etapas</SelectItem>
            {stages.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.tag} onValueChange={(v) => onChange({ ...filters, tag: v })}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Tag" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas as tags</SelectItem>
            {tags.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    );
  }
  ```

- [ ] Create `frontend/components/crm/AddInteractionDialog.tsx` — Dialog with form fields: type (Select: ligacao/whatsapp/reuniao/email/outro), direction (Select: inbound/outbound), occurred_at (date input), notes (Textarea). On submit calls `createInteraction()`:
  ```tsx
  "use client";
  import { useForm } from "react-hook-form";
  import { zodResolver } from "@hookform/resolvers/zod";
  import { z } from "zod";
  import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
  import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
  import { Textarea } from "@/components/ui/textarea";
  import { createInteraction } from "@/services/crm-api";
  import toast from "react-hot-toast";

  const schema = z.object({
    type: z.enum(["ligacao", "whatsapp", "reuniao", "email", "outro"]),
    direction: z.enum(["inbound", "outbound"]),
    occurred_at: z.string().min(1, "Obrigatório"),
    notes: z.string().optional(),
  });

  interface Props {
    personId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
  }

  export function AddInteractionDialog({ personId, open, onOpenChange, onSuccess }: Props) {
    const form = useForm({ resolver: zodResolver(schema), defaultValues: { occurred_at: new Date().toISOString().slice(0, 16) } });

    async function onSubmit(values: z.infer<typeof schema>) {
      try {
        await createInteraction({ ...values, person_id: personId });
        toast.success("Interação registrada");
        onOpenChange(false);
        onSuccess();
      } catch {
        toast.error("Erro ao registrar interação");
      }
    }

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Interação</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem><FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {["ligacao","whatsapp","reuniao","email","outro"].map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="direction" render={({ field }) => (
                <FormItem><FormLabel>Direção</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="inbound">Entrada</SelectItem>
                      <SelectItem value="outbound">Saída</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="occurred_at" render={({ field }) => (
                <FormItem><FormLabel>Data/Hora</FormLabel>
                  <FormControl><Input type="datetime-local" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>Observações</FormLabel>
                  <FormControl><Textarea {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full">Salvar</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
  }
  ```

- [ ] Create `frontend/components/crm/AddTaskDialog.tsx` — Dialog with fields: title (Input), description (Textarea), priority (Select: low/medium/high), due_at (datetime-local Input), assigned_to_id (Select from users list). On submit calls `createTask()`.

- [ ] Create `frontend/components/crm/ContactTimeline.tsx` — unified chronological timeline merging interactions, tasks, pipeline history, and events. Each entry shows icon (based on type), date, description, user. Uses `getPersonInteractions`, `getPersonTasks`, `getPersonPipelineHistory`, `getPersonEvents` and merges + sorts by date desc.

- [ ] Create `frontend/app/(dashboard)/crm/contacts/page.tsx`:
  ```tsx
  "use client";
  import { useEffect, useState } from "react";
  import { useRouter } from "next/navigation";
  import { getContacts } from "@/services/crm-api";
  import { getPipelineStages, getTags } from "@/services/crm-api";
  import { useCrmStore } from "@/stores/crm-store";
  import { ContactFilters } from "@/components/crm/ContactFilters";
  import { Badge } from "@/components/ui/badge";
  import { Button } from "@/components/ui/button";
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
  import { format } from "date-fns";
  import type { CrmContact } from "@/types/crm";

  export default function ContactsPage() {
    const router = useRouter();
    const { setStages, setTags } = useCrmStore();
    const [contacts, setContacts] = useState<CrmContact[]>([]);
    const [filters, setFilters] = useState({ search: "", type: "", stage: "", tag: "" });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      Promise.all([getPipelineStages(), getTags()]).then(([stages, tags]) => {
        setStages(stages as any);
        setTags(tags as any);
      });
    }, []);

    useEffect(() => {
      setLoading(true);
      getContacts({
        stage: filters.stage || undefined,
        tag: filters.tag || undefined,
        type: filters.type || undefined,
        search: filters.search || undefined,
      }).then((data) => {
        setContacts(data as any);
        setLoading(false);
      });
    }, [filters]);

    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Contatos</h1>
          <Button onClick={() => router.push("/people/new")}>Novo Contato</Button>
        </div>
        <ContactFilters filters={filters} onChange={setFilters} />
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Última Interação</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Carregando...</TableCell></TableRow>
              ) : contacts.map((c) => (
                <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell><Badge variant="outline">{c.type}</Badge></TableCell>
                  <TableCell>
                    {c.stage && (
                      <Badge style={{ backgroundColor: c.stage.color + "20", color: c.stage.color }}>
                        {c.stage.name}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {c.tags.map((t) => (
                        <Badge key={t.id} style={{ backgroundColor: t.color + "20", color: t.color }}>
                          {t.name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {c.last_interaction_at ? format(new Date(c.last_interaction_at), "dd/MM/yyyy") : "—"}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => router.push(`/crm/contacts/${c.id}`)}>
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }
  ```

- [ ] Create `frontend/app/(dashboard)/crm/contacts/[id]/page.tsx` — contact profile page with Tabs: Overview (personal data card), Timeline (ContactTimeline component), Tasks (task list for this person), Events (event cards), Pipeline History (stage movement log). Header shows name, type badge, current stage badge, tags, and action buttons (Add Interaction, Add Task).

- [ ] Git commit: `feat(frontend/crm): contacts list with filters and full contact profile page`

---

## Chunk 3: CRM — Pipeline Kanban

### Goal
Build the drag-and-drop kanban board using @dnd-kit, with optimistic updates and a move confirmation dialog.

### Steps

- [ ] Create `frontend/components/crm/PipelineCard.tsx` — draggable card using `useDraggable` from @dnd-kit/core. Displays: person name, type badge, stage color dot, last interaction date, open task count badge. On click navigates to `/crm/contacts/[id]`:
  ```tsx
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

    const style = { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.5 : 1 };

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
        <div className="flex items-center gap-2">
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
  ```

- [ ] Create `frontend/components/crm/MovePersonDialog.tsx` — confirmation Dialog shown after a drop. Shows: contact name, source stage → target stage arrow, optional notes Textarea. On confirm calls `movePerson()`. On cancel triggers rollback callback:
  ```tsx
  "use client";
  import { useState } from "react";
  import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
  import { Button } from "@/components/ui/button";
  import { Textarea } from "@/components/ui/textarea";
  import { movePerson } from "@/services/crm-api";
  import toast from "react-hot-toast";

  interface Props {
    open: boolean;
    contactName: string;
    contactId: string;
    fromStage: string;
    toStageId: string;
    toStageName: string;
    onSuccess: () => void;
    onCancel: () => void;
  }

  export function MovePersonDialog({ open, contactName, contactId, fromStage, toStageId, toStageName, onSuccess, onCancel }: Props) {
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleConfirm() {
      setLoading(true);
      try {
        await movePerson(contactId, toStageId, notes);
        toast.success(`${contactName} movido para ${toStageName}`);
        onSuccess();
      } catch {
        toast.error("Erro ao mover contato");
        onCancel();
      } finally {
        setLoading(false);
      }
    }

    return (
      <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mover {contactName}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {fromStage} → <span className="font-medium text-foreground">{toStageName}</span>
          </p>
          <Textarea
            placeholder="Observações (opcional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={onCancel}>Cancelar</Button>
            <Button onClick={handleConfirm} disabled={loading}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
  ```

- [ ] Create `frontend/components/crm/PipelineKanban.tsx` — main kanban board. Uses `DndContext` + `DragOverlay` from @dnd-kit/core. Renders one column per pipeline stage using `useDroppable`. On `onDragEnd`: apply optimistic update to contacts state, show `MovePersonDialog`, rollback if cancelled or API fails. Loads stages from store, loads contacts per stage via `getPipelineStageContacts()`:
  ```tsx
  "use client";
  import { useEffect, useState } from "react";
  import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from "@dnd-kit/core";
  import { PipelineCard } from "./PipelineCard";
  import { MovePersonDialog } from "./MovePersonDialog";
  import { useCrmStore } from "@/stores/crm-store";
  import { getPipelineStages, getPipelineStageContacts } from "@/services/crm-api";
  import type { CrmContact, PipelineStage } from "@/types/crm";

  export function PipelineKanban() {
    const { stages, setStages } = useCrmStore();
    const [columnContacts, setColumnContacts] = useState<Record<string, CrmContact[]>>({});
    const [activeContact, setActiveContact] = useState<CrmContact | null>(null);
    const [moveState, setMoveState] = useState<{
      contact: CrmContact; fromStageId: string; toStageId: string; toStageName: string;
    } | null>(null);
    const [previewContacts, setPreviewContacts] = useState<Record<string, CrmContact[]>>({});

    useEffect(() => {
      getPipelineStages().then((s) => {
        setStages(s as any);
        Promise.all((s as PipelineStage[]).map((stage) =>
          getPipelineStageContacts(stage.id).then((contacts) => ({ stageId: stage.id, contacts }))
        )).then((results) => {
          const map: Record<string, CrmContact[]> = {};
          results.forEach(({ stageId, contacts }) => { map[stageId] = contacts as CrmContact[]; });
          setColumnContacts(map);
          setPreviewContacts(map);
        });
      });
    }, []);

    function handleDragStart(event: DragStartEvent) {
      setActiveContact(event.active.data.current?.contact ?? null);
    }

    function handleDragEnd(event: DragEndEvent) {
      const { active, over } = event;
      if (!over || !activeContact) { setActiveContact(null); return; }
      const fromStageId = Object.keys(previewContacts).find((sid) =>
        previewContacts[sid].some((c) => c.id === active.id)
      );
      const toStageId = over.id as string;
      if (!fromStageId || fromStageId === toStageId) { setActiveContact(null); return; }

      // Optimistic update
      const next = { ...previewContacts };
      next[fromStageId] = next[fromStageId].filter((c) => c.id !== active.id);
      next[toStageId] = [...(next[toStageId] ?? []), activeContact];
      setPreviewContacts(next);

      const toStage = stages.find((s) => s.id === toStageId);
      setMoveState({ contact: activeContact, fromStageId, toStageId, toStageName: toStage?.name ?? "" });
      setActiveContact(null);
    }

    function handleMoveSuccess() {
      setColumnContacts(previewContacts);
      setMoveState(null);
    }

    function handleMoveCancel() {
      setPreviewContacts(columnContacts); // rollback
      setMoveState(null);
    }

    return (
      <>
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {stages.map((stage) => (
              <KanbanColumn key={stage.id} stage={stage} contacts={previewContacts[stage.id] ?? []} />
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
            fromStage={stages.find((s) => s.id === moveState.fromStageId)?.name ?? ""}
            toStageId={moveState.toStageId}
            toStageName={moveState.toStageName}
            onSuccess={handleMoveSuccess}
            onCancel={handleMoveCancel}
          />
        )}
      </>
    );
  }

  function KanbanColumn({ stage, contacts }: { stage: PipelineStage; contacts: CrmContact[] }) {
    const { isOver, setNodeRef } = (require("@dnd-kit/core") as any).useDroppable({ id: stage.id });
    return (
      <div
        ref={setNodeRef}
        className={`flex-shrink-0 w-72 bg-muted/30 rounded-lg p-3 space-y-2 min-h-96 ${isOver ? "ring-2 ring-primary" : ""}`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
            <span className="font-medium text-sm">{stage.name}</span>
          </div>
          <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">{contacts.length}</span>
        </div>
        {contacts.map((c) => <PipelineCard key={c.id} contact={c} />)}
      </div>
    );
  }
  ```

- [ ] Create `frontend/app/(dashboard)/crm/pipeline/page.tsx` — loads pipeline data and renders `<PipelineKanban />`:
  ```tsx
  import { PipelineKanban } from "@/components/crm/PipelineKanban";

  export default function PipelinePage() {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">Pipeline de Contatos</h1>
        <PipelineKanban />
      </div>
    );
  }
  ```

- [ ] Git commit: `feat(frontend/crm): pipeline kanban with dnd-kit drag-and-drop and move confirmation`

---

## Chunk 4: CRM — Tasks Page

### Goal
Build the tasks management page with filters, create dialog, and the notification bell component.

### Steps

- [ ] Create `frontend/components/crm/NotificationBell.tsx` — polls `getUnreadCount()` every 30s using `setInterval` in a `useEffect`. Shows Bell icon (lucide-react) with red badge when count > 0. On click opens a Popover with a scrollable notification list loaded from `getNotifications()`. Each item shows message, relative time (date-fns `formatDistanceToNow`), and a "Marcar como lida" button. Header has "Marcar todas" button:
  ```tsx
  "use client";
  import { useEffect, useState } from "react";
  import { Bell } from "lucide-react";
  import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
  import { Button } from "@/components/ui/button";
  import { Badge } from "@/components/ui/badge";
  import { getUnreadCount, getNotifications, markRead, markAllRead } from "@/services/crm-api";
  import { formatDistanceToNow } from "date-fns";
  import { ptBR } from "date-fns/locale";
  import type { CrmNotification } from "@/types/crm";

  export function NotificationBell() {
    const [count, setCount] = useState(0);
    const [notifications, setNotifications] = useState<CrmNotification[]>([]);
    const [open, setOpen] = useState(false);

    useEffect(() => {
      const poll = () => getUnreadCount().then((r: any) => setCount(r.count ?? 0));
      poll();
      const id = setInterval(poll, 30_000);
      return () => clearInterval(id);
    }, []);

    useEffect(() => {
      if (open) getNotifications().then((n) => setNotifications(n as any));
    }, [open]);

    async function handleMarkRead(id: string) {
      await markRead(id);
      setNotifications((ns) => ns.map((n) => n.id === id ? { ...n, read: true } : n));
      setCount((c) => Math.max(0, c - 1));
    }

    async function handleMarkAll() {
      await markAllRead();
      setNotifications((ns) => ns.map((n) => ({ ...n, read: true })));
      setCount(0);
    }

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {count > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500">
                {count}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0" align="end">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="font-semibold">Notificações</span>
            {count > 0 && <Button variant="ghost" size="sm" onClick={handleMarkAll}>Marcar todas</Button>}
          </div>
          <div className="max-h-96 overflow-y-auto divide-y">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Sem notificações</p>
            ) : notifications.map((n) => (
              <div key={n.id} className={`p-4 ${n.read ? "opacity-60" : "bg-muted/30"}`}>
                <p className="text-sm">{n.message}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                  </span>
                  {!n.read && (
                    <Button variant="ghost" size="sm" onClick={() => handleMarkRead(n.id)}>
                      Marcar como lida
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    );
  }
  ```

- [ ] Create `frontend/components/crm/CreateTaskDialog.tsx` — Dialog with React Hook Form + Zod validation. Fields: title (required), description (optional), priority (Select: low/medium/high), due_at (datetime-local), person_id (optional searchable Select from contacts), assigned_to_id (optional Select from users). On submit calls `createTask()` and calls `onSuccess()`.

- [ ] Create `frontend/components/crm/TaskList.tsx` — filterable task list component. Props: `tasks`, `onStatusChange`, `onDelete`. Renders table with columns: title, person link, priority badge (color-coded: high=red, medium=yellow, low=blue), status badge, due date (red if overdue), assigned to, actions (Complete button, Edit, Delete). Filter bar at top: status Select, priority Select, due date range.

- [ ] Create `frontend/app/(dashboard)/crm/tasks/page.tsx` — tasks page. On mount loads `getTasks()`. Has tab toggle "Minhas tarefas" / "Todas" (passes `assignedTo: "me"` param). Shows `CreateTaskDialog` trigger button. Renders `TaskList` with loaded data. On task complete calls `completeTask()` and refreshes:
  ```tsx
  "use client";
  import { useEffect, useState } from "react";
  import { getTasks, completeTask, deleteTask } from "@/services/crm-api";
  import { TaskList } from "@/components/crm/TaskList";
  import { CreateTaskDialog } from "@/components/crm/CreateTaskDialog";
  import { Button } from "@/components/ui/button";
  import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
  import type { CrmTask } from "@/types/crm";

  export default function TasksPage() {
    const [tasks, setTasks] = useState<CrmTask[]>([]);
    const [scope, setScope] = useState<"me" | "all">("me");
    const [createOpen, setCreateOpen] = useState(false);

    async function loadTasks() {
      const data = await getTasks(scope === "me" ? { assignedTo: "me" } : {});
      setTasks(data as any);
    }

    useEffect(() => { loadTasks(); }, [scope]);

    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Tarefas</h1>
          <Button onClick={() => setCreateOpen(true)}>Nova Tarefa</Button>
        </div>
        <Tabs value={scope} onValueChange={(v) => setScope(v as any)}>
          <TabsList>
            <TabsTrigger value="me">Minhas Tarefas</TabsTrigger>
            <TabsTrigger value="all">Todas</TabsTrigger>
          </TabsList>
        </Tabs>
        <TaskList
          tasks={tasks}
          onStatusChange={async (id) => { await completeTask(id); loadTasks(); }}
          onDelete={async (id) => { await deleteTask(id); loadTasks(); }}
        />
        <CreateTaskDialog open={createOpen} onOpenChange={setCreateOpen} onSuccess={loadTasks} />
      </div>
    );
  }
  ```

- [ ] Git commit: `feat(frontend/crm): tasks page with filters, create dialog, and notification bell`

---

## Chunk 5: CRM — Events + Import + Dashboard

### Goal
Build the CRM dashboard KPI page, events calendar, and CSV import wizard.

### Steps

- [ ] Create `frontend/components/crm/KpiCards.tsx` — grid of 6 Card components showing: Total Contatos, Novos este Mês, Tarefas Abertas, Tarefas Atrasadas, Interações esta Semana, Próximos Eventos. Each card has icon (lucide-react), value in large text, label in muted text, and a subtle color accent. Uses `CrmKpis` type:
  ```tsx
  import { Card, CardContent } from "@/components/ui/card";
  import { Users, UserPlus, CheckSquare, AlertCircle, MessageSquare, Calendar } from "lucide-react";
  import type { CrmKpis } from "@/types/crm";

  interface Props { kpis: CrmKpis }

  const items = [
    { key: "total_contacts", label: "Total de Contatos", icon: Users, color: "text-blue-500" },
    { key: "new_contacts_this_month", label: "Novos este Mês", icon: UserPlus, color: "text-green-500" },
    { key: "open_tasks", label: "Tarefas Abertas", icon: CheckSquare, color: "text-yellow-500" },
    { key: "overdue_tasks", label: "Tarefas Atrasadas", icon: AlertCircle, color: "text-red-500" },
    { key: "interactions_this_week", label: "Interações esta Semana", icon: MessageSquare, color: "text-purple-500" },
    { key: "upcoming_events", label: "Próximos Eventos", icon: Calendar, color: "text-indigo-500" },
  ] as const;

  export function KpiCards({ kpis }: Props) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(({ key, label, icon: Icon, color }) => (
          <Card key={key}>
            <CardContent className="p-6 flex items-center gap-4">
              <Icon className={`h-10 w-10 ${color}`} />
              <div>
                <p className="text-3xl font-bold">{kpis[key]}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  ```

- [ ] Create `frontend/app/(dashboard)/crm/page.tsx` — CRM dashboard. Loads `getDashboardKpis()`, `getPipelineFunnel()`, `getTasksSummary()`. Renders: `KpiCards`, a bar chart (react-apexcharts) for pipeline funnel (stage name on X, count on Y with stage colors), a donut chart for tasks by status:
  ```tsx
  "use client";
  import { useEffect, useState } from "react";
  import { getDashboardKpis, getPipelineFunnel, getTasksSummary } from "@/services/crm-api";
  import { KpiCards } from "@/components/crm/KpiCards";
  import dynamic from "next/dynamic";
  import type { CrmKpis, PipelineFunnel } from "@/types/crm";

  const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

  export default function CrmDashboardPage() {
    const [kpis, setKpis] = useState<CrmKpis | null>(null);
    const [funnel, setFunnel] = useState<PipelineFunnel[]>([]);
    const [tasksSummary, setTasksSummary] = useState<any>(null);

    useEffect(() => {
      Promise.all([getDashboardKpis(), getPipelineFunnel(), getTasksSummary()])
        .then(([k, f, t]) => {
          setKpis(k as any);
          setFunnel(f as any);
          setTasksSummary(t);
        });
    }, []);

    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Dashboard CRM</h1>
        {kpis && <KpiCards kpis={kpis} />}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-lg border p-4">
            <h2 className="font-semibold mb-4">Funil de Pipeline</h2>
            {funnel.length > 0 && (
              <Chart
                type="bar"
                height={250}
                options={{
                  chart: { toolbar: { show: false } },
                  xaxis: { categories: funnel.map((f) => f.stage_name) },
                  colors: funnel.map((f) => f.stage_color),
                  plotOptions: { bar: { distributed: true } },
                  legend: { show: false },
                }}
                series={[{ name: "Contatos", data: funnel.map((f) => f.count) }]}
              />
            )}
          </div>
          <div className="rounded-lg border p-4">
            <h2 className="font-semibold mb-4">Tarefas por Status</h2>
            {tasksSummary && (
              <Chart
                type="donut"
                height={250}
                options={{
                  labels: ["Pendentes", "Em andamento", "Concluídas", "Canceladas"],
                  colors: ["#f59e0b", "#3b82f6", "#22c55e", "#6b7280"],
                }}
                series={[
                  tasksSummary.pending ?? 0,
                  tasksSummary.in_progress ?? 0,
                  tasksSummary.done ?? 0,
                  tasksSummary.cancelled ?? 0,
                ]}
              />
            )}
          </div>
        </div>
      </div>
    );
  }
  ```

- [ ] Create `frontend/app/(dashboard)/crm/events/page.tsx` — events page with toggle between FullCalendar view and table list. Calendar uses `@fullcalendar/daygrid` plugin, events mapped from `getEvents()`. Click on event navigates to `[id]` page. "Novo Evento" button opens create Dialog:
  ```tsx
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

    useEffect(() => { getEvents().then((e) => setEvents(e as any)); }, []);

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
            <Button variant={view === "calendar" ? "default" : "outline"} size="icon" onClick={() => setView("calendar")}><Calendar className="h-4 w-4" /></Button>
            <Button variant={view === "list" ? "default" : "outline"} size="icon" onClick={() => setView("list")}><List className="h-4 w-4" /></Button>
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
            {events.map((e) => (
              <div key={e.id} className="border rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/crm/events/${e.id}`)}>
                <div>
                  <p className="font-medium">{e.title}</p>
                  <p className="text-sm text-muted-foreground">{e.location}</p>
                </div>
                <span className="text-sm text-muted-foreground">{new Date(e.starts_at).toLocaleDateString("pt-BR")}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  ```

- [ ] Create `frontend/app/(dashboard)/crm/events/[id]/page.tsx` — event detail page. Shows event header (title, dates, location, description). Below, attendance management: table of attendees with status badge (invited/confirmed/declined/attended), "Adicionar Pessoa" button opens a Select dialog to pick a contact and add them, status dropdown to update attendance inline.

- [ ] Create `frontend/components/crm/CsvImportWizard.tsx` — 3-step wizard component:
  - Step 1 "Upload": drag-and-drop file zone (accepts .csv). On file selected uses `papaparse` to parse locally and advances to Step 2.
  - Step 2 "Preview": table showing first 10 rows parsed by papaparse. Column headers shown. Confirm button calls `uploadCsv()`.
  - Step 3 "Resultado": polls `getImportStatus()` every 3s until status is `done` or `error`. Shows progress bar (`imported_rows / total_rows`), error count, link to view errors.

- [ ] Create `frontend/app/(dashboard)/crm/import/page.tsx`:
  ```tsx
  import { CsvImportWizard } from "@/components/crm/CsvImportWizard";
  export default function ImportPage() {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">Importar Contatos</h1>
        <p className="text-muted-foreground">Importe contatos em massa via arquivo CSV.</p>
        <CsvImportWizard />
      </div>
    );
  }
  ```

- [ ] Git commit: `feat(frontend/crm): dashboard KPIs, events calendar, CSV import wizard`

---

## Chunk 6: CRM — Settings (Pipeline + Tags)

### Goal
Build the pipeline stage manager and tag manager pages using @dnd-kit/sortable for reordering.

### Steps

- [ ] Create `frontend/components/crm/StageSortable.tsx` — sortable list of pipeline stages using `SortableContext` and `useSortable` from @dnd-kit/sortable. Each stage row shows: drag handle (GripVertical icon), color dot, name, edit button (opens inline edit), delete button. On drag end calls `reorderStages(newOrderedIds)`:
  ```tsx
  "use client";
  import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
  import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
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

  function SortableStageRow({ stage, onEdit, onDelete }: { stage: PipelineStage; onEdit: () => void; onDelete: () => void }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: stage.id });
    const style = { transform: CSS.Transform.toString(transform), transition };
    return (
      <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-3 border rounded-lg bg-card">
        <button {...listeners} {...attributes} className="cursor-grab"><GripVertical className="h-4 w-4 text-muted-foreground" /></button>
        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: stage.color }} />
        <span className="flex-1 font-medium">{stage.name}</span>
        {stage.is_default && <span className="text-xs text-muted-foreground">Padrão</span>}
        <Button variant="ghost" size="icon" onClick={onEdit}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={onDelete}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    );
  }

  export function StageSortable({ stages, onStagesChange, onEdit, onDelete }: Props) {
    async function handleDragEnd(event: DragEndEvent) {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = stages.findIndex((s) => s.id === active.id);
      const newIndex = stages.findIndex((s) => s.id === over.id);
      const newStages = arrayMove(stages, oldIndex, newIndex);
      onStagesChange(newStages);
      try {
        await reorderStages(newStages.map((s) => s.id));
        toast.success("Ordem salva");
      } catch {
        toast.error("Erro ao salvar ordem");
        onStagesChange(stages);
      }
    }

    return (
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={stages.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {stages.map((s) => (
              <SortableStageRow key={s.id} stage={s} onEdit={() => onEdit(s)} onDelete={() => onDelete(s.id)} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    );
  }
  ```

- [ ] Create `frontend/app/(dashboard)/crm/settings/pipeline/page.tsx` — pipeline settings page. Loads stages on mount. Renders `StageSortable`. "Nova Etapa" button opens a Dialog with name (Input) and color (color Input type="color") fields. Edit opens same Dialog pre-filled. Delete shows a confirmation Alert Dialog. All mutations call the API then refresh stage list.

- [ ] Create `frontend/app/(dashboard)/crm/settings/tags/page.tsx` — tags settings page. Shows a grid of tag chips (each with colored background). "Nova Tag" button opens Dialog with name (Input) and color (Input type="color"). Edit/delete inline on each chip. All mutations call the API then refresh list.

- [ ] Git commit: `feat(frontend/crm): pipeline settings with sortable reorder and tag management`

---

## Chunk 7: Electoral — Elections + Campaigns

### Goal
Build elections list and campaign detail page with tabbed layout including team, schedule, finance, and TSE sections.

### Steps

- [ ] Create `frontend/app/(dashboard)/electoral/elections/page.tsx` — elections list. Table with columns: name, election_date, runoff_date, actions (View, Edit). "Nova Eleição" button opens Dialog.

- [ ] Create `frontend/app/(dashboard)/electoral/elections/[id]/page.tsx` — election detail. Shows metadata card and list of campaigns for this election.

- [ ] Create `frontend/app/(dashboard)/electoral/campaigns/page.tsx` — campaigns list. Table: name, election name, candidate, status badge, budget gauge (spent/limit), actions. Loads `getCampaigns()`.

- [ ] Create `frontend/components/electoral/CampaignBudgetGauge.tsx` — Progress bar component showing spent vs budget_limit. Label shows "R$ {spent} / R$ {limit}" and percentage. Uses `@radix-ui/react-progress`:
  ```tsx
  import { Progress } from "@/components/ui/progress";

  interface Props { spent: number; limit: number }

  export function CampaignBudgetGauge({ spent, limit }: Props) {
    const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
    const over = pct >= 90;
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span>R$ {spent.toLocaleString("pt-BR")}</span>
          <span className="text-muted-foreground">R$ {limit.toLocaleString("pt-BR")}</span>
        </div>
        <Progress value={pct} className={over ? "[&>div]:bg-red-500" : ""} />
      </div>
    );
  }
  ```

- [ ] Create `frontend/components/electoral/TeamMemberList.tsx` — table of team members. Columns: person name, role badge, payment type, salary (if paid), joined date, actions (Edit, Remove). "Adicionar Membro" button opens Dialog with fields: person (searchable Select), role, payment_type, salary.

- [ ] Create `frontend/components/electoral/ContractList.tsx` — table of contracts. Columns: supplier name, description, value (formatted R$), status badge, signed_at date, actions. "Novo Contrato" button opens Dialog.

- [ ] Create `frontend/app/(dashboard)/electoral/campaigns/[id]/page.tsx` — campaign detail with Tabs: Overview, Team, Schedule, Finance, TSE Reports:
  - Overview tab: Campaign metadata card (name, election, candidate, status, budget), `CampaignBudgetGauge`.
  - Team tab: `TeamMemberList` loaded from `getCampaignTeam()`.
  - Schedule tab: link to `/electoral/campaigns/[id]/schedule` or embed FullCalendar here.
  - Finance tab: financial transactions list (uses existing financial API filtered by campaign context), total spent, `CampaignBudgetGauge`, `ContractList`.
  - TSE Reports tab: link to `/electoral/campaigns/[id]/tse`.

- [ ] Git commit: `feat(frontend/electoral): elections list, campaigns list and detail with tabs`

---

## Chunk 8: Electoral — Campaign Schedule + TSE Reports

### Goal
Build the campaign schedule calendar and TSE report management pages.

### Steps

- [ ] Create `frontend/components/electoral/TseCodeSelect.tsx` — searchable Select (using cmdk Command component) that loads TSE codes from `getTseCodes()`. Displays code + description in dropdown. Filters by typing. Returns selected `TseCode` object:
  ```tsx
  "use client";
  import { useState, useEffect } from "react";
  import { Check, ChevronsUpDown } from "lucide-react";
  import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
  import { Button } from "@/components/ui/button";
  import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
  import { getTseCodes } from "@/services/electoral-api";
  import type { TseCode } from "@/types/electoral";

  interface Props { value?: TseCode; onChange: (code: TseCode) => void }

  export function TseCodeSelect({ value, onChange }: Props) {
    const [codes, setCodes] = useState<TseCode[]>([]);
    const [open, setOpen] = useState(false);

    useEffect(() => { getTseCodes().then((c) => setCodes(c as any)); }, []);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            {value ? `${value.code} — ${value.description}` : "Selecionar código TSE"}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0">
          <Command>
            <CommandInput placeholder="Buscar código..." />
            <CommandEmpty>Nenhum código encontrado.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-y-auto">
              {codes.map((c) => (
                <CommandItem key={c.id} value={`${c.code} ${c.description}`} onSelect={() => { onChange(c); setOpen(false); }}>
                  <Check className={`mr-2 h-4 w-4 ${value?.id === c.id ? "opacity-100" : "opacity-0"}`} />
                  <span className="font-mono mr-2">{c.code}</span> {c.description}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }
  ```

- [ ] Create `frontend/components/electoral/TseReportItems.tsx` — table of TSE report items. Columns: TSE code (code + description), description, amount (R$), date. "Adicionar Item" button opens Dialog using `TseCodeSelect` for code selection plus description (Input), amount (number Input), date (date Input). On submit calls `addTseReportItem()`.

- [ ] Create `frontend/app/(dashboard)/electoral/campaigns/[id]/schedule/page.tsx` — campaign schedule page using FullCalendar (timegrid view to show daily events). Loads `getSchedule()`. Events mapped with type-based colors. "Novo Evento" button opens Dialog with fields: title, type (Select: corpo_a_corpo/comicio/debate/reuniao/outro), starts_at, ends_at, location, notes.

- [ ] Create `frontend/app/(dashboard)/electoral/campaigns/[id]/tse/page.tsx` — TSE reports list. Table: period, type badge, status badge, is_final badge, submitted_at, actions (View, Submit button for draft reports). "Novo Relatório" button opens Dialog.

- [ ] Create `frontend/app/(dashboard)/electoral/campaigns/[id]/tse/[reportId]/page.tsx` — TSE report detail. Header shows report metadata (type, period, status). Below, `TseReportItems` component. If status is `draft`, shows "Enviar ao TSE" button that calls `submitTseReport()` with confirmation Alert Dialog.

- [ ] Git commit: `feat(frontend/electoral): campaign schedule calendar and TSE report management`

---

## Chunk 9: Party Structure + Mandates

### Goal
Build the party chapters tree, organs, and mandates pages.

### Steps

- [ ] Create `frontend/components/party/ChapterTree.tsx` — recursive tree component that renders nested `PartyChapter` items. Each node shows: chapter name, level badge, member count, expand/collapse toggle (using @radix-ui/react-collapsible), and action buttons (View, Edit). Children are rendered recursively with left padding for indentation:
  ```tsx
  "use client";
  import { useState } from "react";
  import * as Collapsible from "@radix-ui/react-collapsible";
  import { ChevronRight, ChevronDown } from "lucide-react";
  import { Badge } from "@/components/ui/badge";
  import { Button } from "@/components/ui/button";
  import { useRouter } from "next/navigation";
  import type { PartyChapter } from "@/types/party";

  const LEVEL_COLORS: Record<string, string> = {
    nacional: "bg-purple-100 text-purple-700",
    estadual: "bg-blue-100 text-blue-700",
    municipal: "bg-green-100 text-green-700",
    zonal: "bg-orange-100 text-orange-700",
  };

  function ChapterNode({ chapter, depth = 0 }: { chapter: PartyChapter; depth?: number }) {
    const [open, setOpen] = useState(depth < 2);
    const router = useRouter();
    const hasChildren = chapter.children && chapter.children.length > 0;

    return (
      <Collapsible.Root open={open} onOpenChange={setOpen}>
        <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50" style={{ paddingLeft: `${depth * 24 + 8}px` }}>
          {hasChildren ? (
            <Collapsible.Trigger asChild>
              <button className="p-0.5 rounded hover:bg-muted">
                {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            </Collapsible.Trigger>
          ) : <span className="w-5" />}
          <span className="flex-1 font-medium text-sm">{chapter.name}</span>
          <Badge className={`text-xs ${LEVEL_COLORS[chapter.level] ?? ""}`}>{chapter.level}</Badge>
          {chapter.member_count !== undefined && (
            <span className="text-xs text-muted-foreground">{chapter.member_count} membros</span>
          )}
          <Button variant="ghost" size="sm" onClick={() => router.push(`/party/chapters/${chapter.id}`)}>Ver</Button>
        </div>
        {hasChildren && (
          <Collapsible.Content>
            {chapter.children!.map((child) => <ChapterNode key={child.id} chapter={child} depth={depth + 1} />)}
          </Collapsible.Content>
        )}
      </Collapsible.Root>
    );
  }

  export function ChapterTree({ chapters }: { chapters: PartyChapter[] }) {
    const roots = chapters.filter((c) => !c.parent_id);
    return (
      <div className="border rounded-lg divide-y">
        {roots.map((c) => <ChapterNode key={c.id} chapter={c} />)}
      </div>
    );
  }
  ```

- [ ] Create `frontend/app/(dashboard)/party/chapters/page.tsx` — loads `getChapters()`, builds tree structure by nesting chapters by `parent_id`, renders `ChapterTree`. "Novo Diretório" button opens Dialog with: name, level (Select), parent_id (optional Select from existing chapters), state, city.

- [ ] Create `frontend/app/(dashboard)/party/chapters/[id]/page.tsx` — chapter detail. Header card with metadata (name, level, state/city, parent chapter link). Below, `ChapterMembers` table loaded from `getChapterMembers()`. Table: person name (link), role, joined_at date. "Adicionar Membro" button opens Dialog with searchable person Select + role Input. Remove member button with confirmation.

- [ ] Create `frontend/app/(dashboard)/party/organs/page.tsx` — organs list. Cards grid (or table) showing: name, description, member count. "Novo Órgão" button. Each card has "Ver Membros" button. Members shown in a Dialog using `getOrganMembers()`.

- [ ] Create `frontend/app/(dashboard)/mandates/page.tsx` — mandates list. Table columns: person name (link), office, jurisdiction, start_date, end_date, status badge (active=green, inactive=gray, suspended=red). Filter by status. "Novo Mandato" button opens Dialog.

- [ ] Create `frontend/app/(dashboard)/mandates/[id]/page.tsx` — mandate detail. Card with all mandate fields. Edit button opens inline form. Delete with confirmation. Related person link navigates to people profile.

- [ ] Git commit: `feat(frontend/party): chapter tree, organs, and mandates pages`

---

## Chunk 10: Navigation + Final Integration

### Goal
Update sidebar navigation to include all new domains with permission-based visibility, add NotificationBell to header, and run final smoke tests.

### Steps

- [ ] Locate the sidebar navigation component (in `frontend/app/client-root.tsx` or the component it imports) and add new menu sections:
  ```
  CRM
    Dashboard (/crm)
    Contatos (/crm/contacts)
    Pipeline (/crm/pipeline)
    Tarefas (/crm/tasks)
    Eventos (/crm/events)
    Importar (/crm/import)
    Configurações (/crm/settings/pipeline)

  Electoral
    Eleições (/electoral/elections)
    Campanhas (/electoral/campaigns)

  Partido
    Diretórios (/party/chapters)
    Órgãos (/party/organs)

  Mandatos (/mandates)
  ```

- [ ] Add `<NotificationBell />` to the dashboard header (top-right area alongside user avatar/dropdown). Import from `@/components/crm/NotificationBell`.

- [ ] Implement permission-based menu hiding. Read `session.user.permissions` (array of permission strings from JWT). Wrap menu items:
  - CRM items: require `crm.contacts.read`
  - CRM Pipeline: require `crm.pipeline.manage`
  - CRM Tasks: require `crm.tasks.manage`
  - CRM Import: require `crm.import.execute`
  - Electoral/Party/Mandates: require matching permission keys when defined in backend RBAC
  Create a `usePermission(key: string): boolean` hook that reads from session:
  ```ts
  // hooks/usePermission.ts
  import { useSession } from "next-auth/react";
  export function usePermission(key: string): boolean {
    const { data: session } = useSession();
    const permissions: string[] = (session?.user as any)?.permissions ?? [];
    return permissions.includes(key);
  }
  ```

- [ ] Add `NEXT_PUBLIC_API_URL` to `frontend/.env.local` (development) and document in README that it must be set to the NestJS API base URL:
  ```
  NEXT_PUBLIC_API_URL=http://localhost:3001
  ```

- [ ] Smoke test checklist — verify each page loads without console errors and API calls return 200:
  - [ ] `/crm` — KPI cards and charts render
  - [ ] `/crm/contacts` — contact list with filter dropdowns populated
  - [ ] `/crm/contacts/[id]` — profile tabs all load
  - [ ] `/crm/pipeline` — kanban columns render with contacts
  - [ ] `/crm/tasks` — task table loads, create dialog opens
  - [ ] `/crm/events` — FullCalendar renders events
  - [ ] `/crm/import` — CSV upload step renders
  - [ ] `/crm/settings/pipeline` — stage list with drag handles
  - [ ] `/crm/settings/tags` — tag grid renders
  - [ ] `/electoral/elections` — elections table loads
  - [ ] `/electoral/campaigns` — campaigns table loads
  - [ ] `/electoral/campaigns/[id]` — all tabs render
  - [ ] `/electoral/campaigns/[id]/schedule` — FullCalendar renders
  - [ ] `/electoral/campaigns/[id]/tse` — reports list loads
  - [ ] `/party/chapters` — chapter tree renders recursively
  - [ ] `/party/organs` — organs list loads
  - [ ] `/mandates` — mandates table loads
  - [ ] NotificationBell polls and shows count badge

- [ ] Git commit: `feat(frontend): sidebar navigation, notification bell, permission guards — frontend complete`
