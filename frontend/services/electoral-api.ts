import api from "./api";
import type { Election, Campaign, TeamMember, CampaignContract,
  ScheduleEvent, TseReport, TseCode, TseReportItem } from "@/types/electoral";

// Elections
export const getElections = async (): Promise<Election[]> => {
  const res = await api.get<{ data: Election[] }>("/electoral/elections");
  return res.data.data;
};
export const getElection = async (id: string): Promise<Election> => {
  const res = await api.get<{ data: Election }>(`/electoral/elections/${id}`);
  return res.data.data;
};
export const createElection = async (data: Partial<Election>): Promise<Election> => {
  const res = await api.post<{ data: Election }>("/electoral/elections", data);
  return res.data.data;
};
export const updateElection = async (id: string, data: Partial<Election>): Promise<Election> => {
  const res = await api.patch<{ data: Election }>(`/electoral/elections/${id}`, data);
  return res.data.data;
};
export const deleteElection = async (id: string): Promise<void> => {
  await api.delete(`/electoral/elections/${id}`);
};

// Campaigns
export const getCampaigns = async (params?: { electionId?: string }): Promise<Campaign[]> => {
  const res = await api.get<{ data: Campaign[] }>("/electoral/campaigns", { params });
  return res.data.data;
};
export const getCampaign = async (id: string): Promise<Campaign> => {
  const res = await api.get<{ data: Campaign }>(`/electoral/campaigns/${id}`);
  return res.data.data;
};
export const createCampaign = async (data: Partial<Campaign>): Promise<Campaign> => {
  const res = await api.post<{ data: Campaign }>("/electoral/campaigns", data);
  return res.data.data;
};
export const updateCampaign = async (id: string, data: Partial<Campaign>): Promise<Campaign> => {
  const res = await api.patch<{ data: Campaign }>(`/electoral/campaigns/${id}`, data);
  return res.data.data;
};
export const deleteCampaign = async (id: string): Promise<void> => {
  await api.delete(`/electoral/campaigns/${id}`);
};

// Team
export const getCampaignTeam = async (id: string): Promise<TeamMember[]> => {
  const res = await api.get<{ data: TeamMember[] }>(`/electoral/campaigns/${id}/team`);
  return res.data.data;
};
export const addTeamMember = async (id: string, data: { personId: string; role?: string }): Promise<TeamMember> => {
  const res = await api.post<{ data: TeamMember }>(`/electoral/campaigns/${id}/team`, data);
  return res.data.data;
};
export const removeTeamMember = async (campaignId: string, memberId: string): Promise<void> => {
  await api.delete(`/electoral/campaigns/${campaignId}/team/${memberId}`);
};

// Contracts
export const getCampaignContracts = async (id: string): Promise<CampaignContract[]> => {
  const res = await api.get<{ data: CampaignContract[] }>(`/electoral/campaigns/${id}/contracts`);
  return res.data.data;
};
export const createContract = async (id: string, data: Partial<CampaignContract>): Promise<CampaignContract> => {
  const res = await api.post<{ data: CampaignContract }>(`/electoral/campaigns/${id}/contracts`, data);
  return res.data.data;
};
export const updateContract = async (campaignId: string, contractId: string, data: Partial<CampaignContract>): Promise<CampaignContract> => {
  const res = await api.patch<{ data: CampaignContract }>(`/electoral/campaigns/${campaignId}/contracts/${contractId}`, data);
  return res.data.data;
};
export const deleteContract = async (campaignId: string, contractId: string): Promise<void> => {
  await api.delete(`/electoral/campaigns/${campaignId}/contracts/${contractId}`);
};

// Schedule
export const getCampaignSchedule = async (id: string): Promise<ScheduleEvent[]> => {
  const res = await api.get<{ data: ScheduleEvent[] }>(`/electoral/campaigns/${id}/schedule`);
  return res.data.data;
};
export const createScheduleEvent = async (id: string, data: Partial<ScheduleEvent>): Promise<ScheduleEvent> => {
  const res = await api.post<{ data: ScheduleEvent }>(`/electoral/campaigns/${id}/schedule`, data);
  return res.data.data;
};
export const updateScheduleEvent = async (campaignId: string, eventId: string, data: Partial<ScheduleEvent>): Promise<ScheduleEvent> => {
  const res = await api.patch<{ data: ScheduleEvent }>(`/electoral/campaigns/${campaignId}/schedule/${eventId}`, data);
  return res.data.data;
};
export const deleteScheduleEvent = async (campaignId: string, eventId: string): Promise<void> => {
  await api.delete(`/electoral/campaigns/${campaignId}/schedule/${eventId}`);
};

// TSE Reports
export const getTseReports = async (id: string): Promise<TseReport[]> => {
  const res = await api.get<{ data: TseReport[] }>(`/electoral/campaigns/${id}/tse-reports`);
  return res.data.data;
};
export const getTseReport = async (campaignId: string, reportId: string): Promise<TseReport> => {
  const res = await api.get<{ data: TseReport }>(`/electoral/campaigns/${campaignId}/tse-reports/${reportId}`);
  return res.data.data;
};
export const createTseReport = async (id: string, data: Partial<TseReport>): Promise<TseReport> => {
  const res = await api.post<{ data: TseReport }>(`/electoral/campaigns/${id}/tse-reports`, data);
  return res.data.data;
};
export const getTseReportItems = async (campaignId: string, reportId: string): Promise<TseReportItem[]> => {
  const res = await api.get<{ data: TseReportItem[] }>(`/electoral/campaigns/${campaignId}/tse-reports/${reportId}/items`);
  return res.data.data;
};
export const getTseCodes = async (): Promise<TseCode[]> => {
  const res = await api.get<{ data: TseCode[] }>("/electoral/tse-codes");
  return res.data.data;
};
