import api from "./api";
import type { CrmTag, PipelineStage, CrmContact, Interaction, CrmTask,
  CrmNotification, CrmEvent, EventAttendance, CrmImport, CrmKpis, PipelineFunnel } from "@/types/crm";

// Tags
export const getTags = async (): Promise<CrmTag[]> => {
  const res = await api.get<{ data: CrmTag[] }>("/crm/tags");
  return res.data.data;
};
export const createTag = async (data: { name: string; color: string }): Promise<CrmTag> => {
  const res = await api.post<{ data: CrmTag }>("/crm/tags", data);
  return res.data.data;
};
export const updateTag = async (id: string, data: Partial<{ name: string; color: string }>): Promise<CrmTag> => {
  const res = await api.patch<{ data: CrmTag }>(`/crm/tags/${id}`, data);
  return res.data.data;
};
export const deleteTag = async (id: string): Promise<void> => {
  await api.delete(`/crm/tags/${id}`);
};
export const addPersonTag = async (personId: string, tagId: string): Promise<void> => {
  await api.post(`/people/${personId}/tags`, { tagId });
};
export const removePersonTag = async (personId: string, tagId: string): Promise<void> => {
  await api.delete(`/people/${personId}/tags/${tagId}`);
};

// Pipeline
export const getPipelineStages = async (): Promise<PipelineStage[]> => {
  const res = await api.get<{ data: PipelineStage[] }>("/crm/pipeline/stages");
  return res.data.data;
};
export const createStage = async (data: { name: string; color: string }): Promise<PipelineStage> => {
  const res = await api.post<{ data: PipelineStage }>("/crm/pipeline/stages", data);
  return res.data.data;
};
export const updateStage = async (id: string, data: Partial<{ name: string; color: string }>): Promise<PipelineStage> => {
  const res = await api.patch<{ data: PipelineStage }>(`/crm/pipeline/stages/${id}`, data);
  return res.data.data;
};
export const deleteStage = async (id: string): Promise<void> => {
  await api.delete(`/crm/pipeline/stages/${id}`);
};
export const reorderStages = async (orderedIds: string[]): Promise<void> => {
  await api.patch("/crm/pipeline/stages/reorder", { orderedIds });
};
export const movePerson = async (personId: string, stageId: string, notes?: string): Promise<void> => {
  await api.post("/crm/pipeline/move", { personId, stageId, notes });
};
export const getPipelineStageContacts = async (stageId: string): Promise<CrmContact[]> => {
  const res = await api.get<{ data: CrmContact[] }>(`/crm/pipeline/stages/${stageId}/people`);
  return res.data.data;
};

// Contacts (people with CRM filters)
export const getContacts = async (params?: { stage?: string; tag?: string; type?: string; search?: string }): Promise<CrmContact[]> => {
  const res = await api.get<{ data: CrmContact[] }>("/people", { params });
  return res.data.data;
};
export const getPersonInteractions = async (personId: string): Promise<Interaction[]> => {
  const res = await api.get<{ data: Interaction[] }>(`/people/${personId}/interactions`);
  return res.data.data;
};
export const getPersonTasks = async (personId: string): Promise<CrmTask[]> => {
  const res = await api.get<{ data: CrmTask[] }>(`/people/${personId}/tasks`);
  return res.data.data;
};
export const getPersonPipelineHistory = async (personId: string): Promise<unknown> => {
  const res = await api.get<{ data: unknown }>(`/people/${personId}/pipeline-history`);
  return res.data.data;
};
export const getPersonEvents = async (personId: string): Promise<CrmEvent[]> => {
  const res = await api.get<{ data: CrmEvent[] }>(`/people/${personId}/events`);
  return res.data.data;
};
export const getPersonTags = async (personId: string): Promise<CrmTag[]> => {
  const res = await api.get<{ data: CrmTag[] }>(`/people/${personId}/tags`);
  return res.data.data;
};

// Interactions
export const createInteraction = async (data: {
  person_id: string; type: string; direction: string; notes?: string; occurred_at: string;
}): Promise<Interaction> => {
  const res = await api.post<{ data: Interaction }>("/crm/interactions", data);
  return res.data.data;
};
export const deleteInteraction = async (id: string): Promise<void> => {
  await api.delete(`/crm/interactions/${id}`);
};

// Tasks
export const getTasks = async (params?: { assignedTo?: string; status?: string; due?: string; personId?: string }): Promise<CrmTask[]> => {
  const res = await api.get<{ data: CrmTask[] }>("/crm/tasks", { params });
  return res.data.data;
};
export const createTask = async (data: {
  title: string; description?: string; priority: string; due_at?: string;
  assigned_to_id?: string; person_id?: string;
}): Promise<CrmTask> => {
  const res = await api.post<{ data: CrmTask }>("/crm/tasks", data);
  return res.data.data;
};
export const updateTask = async (id: string, data: Partial<CrmTask>): Promise<CrmTask> => {
  const res = await api.patch<{ data: CrmTask }>(`/crm/tasks/${id}`, data);
  return res.data.data;
};
export const completeTask = async (id: string): Promise<void> => {
  await api.patch(`/crm/tasks/${id}/complete`);
};
export const deleteTask = async (id: string): Promise<void> => {
  await api.delete(`/crm/tasks/${id}`);
};

// Notifications
export const getNotifications = async (): Promise<CrmNotification[]> => {
  const res = await api.get<{ data: CrmNotification[] }>("/crm/notifications");
  return res.data.data;
};
export const getUnreadCount = async (): Promise<{ count: number }> => {
  const res = await api.get<{ data: { count: number } }>("/crm/notifications/unread-count");
  return res.data.data;
};
export const markRead = async (id: string): Promise<void> => {
  await api.patch(`/crm/notifications/${id}/read`);
};
export const markAllRead = async (): Promise<void> => {
  await api.patch("/crm/notifications/read-all");
};

// Events
export const getEvents = async (): Promise<CrmEvent[]> => {
  const res = await api.get<{ data: CrmEvent[] }>("/crm/events");
  return res.data.data;
};
export const getEvent = async (id: string): Promise<CrmEvent> => {
  const res = await api.get<{ data: CrmEvent }>(`/crm/events/${id}`);
  return res.data.data;
};
export const createEvent = async (data: Partial<CrmEvent>): Promise<CrmEvent> => {
  const res = await api.post<{ data: CrmEvent }>("/crm/events", data);
  return res.data.data;
};
export const updateEvent = async (id: string, data: Partial<CrmEvent>): Promise<CrmEvent> => {
  const res = await api.patch<{ data: CrmEvent }>(`/crm/events/${id}`, data);
  return res.data.data;
};
export const deleteEvent = async (id: string): Promise<void> => {
  await api.delete(`/crm/events/${id}`);
};
export const getEventAttendances = async (id: string): Promise<EventAttendance[]> => {
  const res = await api.get<{ data: EventAttendance[] }>(`/crm/events/${id}/attendances`);
  return res.data.data;
};
export const addAttendance = async (id: string, personId: string): Promise<void> => {
  await api.post(`/crm/events/${id}/attendances`, { personId });
};
export const updateAttendance = async (eventId: string, personId: string, status: string): Promise<void> => {
  await api.patch(`/crm/events/${eventId}/attendances/${personId}`, { status });
};

// Import
export const uploadCsv = async (file: File): Promise<CrmImport> => {
  const form = new FormData();
  form.append("file", file);
  const res = await api.post<{ data: CrmImport }>("/crm/import/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data;
};
export const getImportStatus = async (id: string): Promise<CrmImport> => {
  const res = await api.get<{ data: CrmImport }>(`/crm/import/${id}/status`);
  return res.data.data;
};
export const getImportErrors = async (id: string): Promise<unknown> => {
  const res = await api.get<{ data: unknown }>(`/crm/import/${id}/errors`);
  return res.data.data;
};
export const getImportHistory = async (): Promise<CrmImport[]> => {
  const res = await api.get<{ data: CrmImport[] }>("/crm/import/history");
  return res.data.data;
};

// Dashboard
export const getDashboardKpis = async (): Promise<CrmKpis> => {
  const res = await api.get<{ data: CrmKpis }>("/crm/dashboard/kpis");
  return res.data.data;
};
export const getPipelineFunnel = async (): Promise<PipelineFunnel[]> => {
  const res = await api.get<{ data: PipelineFunnel[] }>("/crm/dashboard/pipeline-funnel");
  return res.data.data;
};
export const getTasksSummary = async (): Promise<unknown> => {
  const res = await api.get<{ data: unknown }>("/crm/dashboard/tasks-summary");
  return res.data.data;
};
