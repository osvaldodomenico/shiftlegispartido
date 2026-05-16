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
