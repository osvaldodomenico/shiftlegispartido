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
