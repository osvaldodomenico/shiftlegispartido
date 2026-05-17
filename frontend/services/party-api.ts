import api from "./api";
import type { PartyChapter, ChapterMember, PartyOrgan, OrganMember, Mandate } from "@/types/party";

// Chapters
export const getChapters = async (): Promise<PartyChapter[]> => {
  const res = await api.get<{ data: PartyChapter[] }>("/party/chapters");
  return res.data.data;
};
export const getChapter = async (id: string): Promise<PartyChapter> => {
  const res = await api.get<{ data: PartyChapter }>(`/party/chapters/${id}`);
  return res.data.data;
};
export const createChapter = async (data: Partial<PartyChapter>): Promise<PartyChapter> => {
  const res = await api.post<{ data: PartyChapter }>("/party/chapters", data);
  return res.data.data;
};
export const updateChapter = async (id: string, data: Partial<PartyChapter>): Promise<PartyChapter> => {
  const res = await api.patch<{ data: PartyChapter }>(`/party/chapters/${id}`, data);
  return res.data.data;
};
export const deleteChapter = async (id: string): Promise<void> => {
  await api.delete(`/party/chapters/${id}`);
};
export const getChapterMembers = async (id: string): Promise<ChapterMember[]> => {
  const res = await api.get<{ data: ChapterMember[] }>(`/party/chapters/${id}/members`);
  return res.data.data;
};
export const addChapterMember = async (id: string, personId: string, role?: string): Promise<void> => {
  await api.post(`/party/chapters/${id}/members`, { personId, role });
};
export const removeChapterMember = async (chapterId: string, memberId: string): Promise<void> => {
  await api.delete(`/party/chapters/${chapterId}/members/${memberId}`);
};

// Organs
export const getOrgans = async (): Promise<PartyOrgan[]> => {
  const res = await api.get<{ data: PartyOrgan[] }>("/party/organs");
  return res.data.data;
};
export const createOrgan = async (data: Partial<PartyOrgan>): Promise<PartyOrgan> => {
  const res = await api.post<{ data: PartyOrgan }>("/party/organs", data);
  return res.data.data;
};
export const updateOrgan = async (id: string, data: Partial<PartyOrgan>): Promise<PartyOrgan> => {
  const res = await api.patch<{ data: PartyOrgan }>(`/party/organs/${id}`, data);
  return res.data.data;
};
export const deleteOrgan = async (id: string): Promise<void> => {
  await api.delete(`/party/organs/${id}`);
};
export const getOrganMembers = async (id: string): Promise<OrganMember[]> => {
  const res = await api.get<{ data: OrganMember[] }>(`/party/organs/${id}/members`);
  return res.data.data;
};
export const addOrganMember = async (id: string, personId: string, role?: string): Promise<void> => {
  await api.post(`/party/organs/${id}/members`, { personId, role });
};
export const updateOrganMember = async (organId: string, memberId: string, data: Partial<OrganMember>): Promise<OrganMember> => {
  const res = await api.patch<{ data: OrganMember }>(`/party/organs/${organId}/members/${memberId}`, data);
  return res.data.data;
};

// Mandates
export const getMandates = async (params?: { personId?: string }): Promise<Mandate[]> => {
  const res = await api.get<{ data: Mandate[] }>("/mandates", { params });
  return res.data.data;
};
export const getMandate = async (id: string): Promise<Mandate> => {
  const res = await api.get<{ data: Mandate }>(`/mandates/${id}`);
  return res.data.data;
};
export const createMandate = async (data: Partial<Mandate>): Promise<Mandate> => {
  const res = await api.post<{ data: Mandate }>("/mandates", data);
  return res.data.data;
};
export const updateMandate = async (id: string, data: Partial<Mandate>): Promise<Mandate> => {
  const res = await api.patch<{ data: Mandate }>(`/mandates/${id}`, data);
  return res.data.data;
};
export const deleteMandate = async (id: string): Promise<void> => {
  await api.delete(`/mandates/${id}`);
};
