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
