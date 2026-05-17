import api from "./api";
import type {
  Election,
  Campaign,
  TeamMember,
  CampaignContract,
  ScheduleEvent,
  TseReport,
  TseCode,
  TseReportItem,
} from "@/types/electoral";

// ─── Elections ────────────────────────────────────────────────────────────────

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

// ─── Campaigns ────────────────────────────────────────────────────────────────

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

// ─── Team ─────────────────────────────────────────────────────────────────────

export const getCampaignTeam = async (id: string): Promise<TeamMember[]> => {
  const res = await api.get<{ data: TeamMember[] }>(`/electoral/campaigns/${id}/team`);
  return res.data.data;
};

export const addTeamMember = async (
  id: string,
  data: { personId?: string; person?: { id: string; name: string }; role?: string; payment_type?: string; salary?: number }
): Promise<TeamMember> => {
  const res = await api.post<{ data: TeamMember }>(`/electoral/campaigns/${id}/team`, data);
  return res.data.data;
};

export const updateTeamMember = async (
  campaignId: string,
  memberId: string,
  data: Partial<TeamMember>
): Promise<TeamMember> => {
  const res = await api.patch<{ data: TeamMember }>(
    `/electoral/campaigns/${campaignId}/team/${memberId}`,
    data
  );
  return res.data.data;
};

export const removeTeamMember = async (campaignId: string, memberId: string): Promise<void> => {
  await api.delete(`/electoral/campaigns/${campaignId}/team/${memberId}`);
};

// ─── Contracts ────────────────────────────────────────────────────────────────

export const getCampaignContracts = async (id: string): Promise<CampaignContract[]> => {
  const res = await api.get<{ data: CampaignContract[] }>(`/electoral/campaigns/${id}/contracts`);
  return res.data.data;
};

// Alias kept for backward-compat (campaign detail page imported as getContracts)
export const getContracts = getCampaignContracts;

export const createContract = async (
  id: string,
  data: Partial<CampaignContract>
): Promise<CampaignContract> => {
  const res = await api.post<{ data: CampaignContract }>(
    `/electoral/campaigns/${id}/contracts`,
    data
  );
  return res.data.data;
};

export const updateContract = async (
  campaignId: string,
  contractId: string,
  data: Partial<CampaignContract>
): Promise<CampaignContract> => {
  const res = await api.patch<{ data: CampaignContract }>(
    `/electoral/campaigns/${campaignId}/contracts/${contractId}`,
    data
  );
  return res.data.data;
};

export const deleteContract = async (campaignId: string, contractId: string): Promise<void> => {
  await api.delete(`/electoral/campaigns/${campaignId}/contracts/${contractId}`);
};

export const addContractPayment = async (
  campaignId: string,
  contractId: string,
  data: { amount: number; paid_at: string; notes?: string }
): Promise<void> => {
  await api.post(
    `/electoral/campaigns/${campaignId}/contracts/${contractId}/payments`,
    data
  );
};

// ─── Schedule ─────────────────────────────────────────────────────────────────

export const getCampaignSchedule = async (id: string): Promise<ScheduleEvent[]> => {
  const res = await api.get<{ data: ScheduleEvent[] }>(`/electoral/campaigns/${id}/schedule`);
  return res.data.data;
};

// Alias for schedule page (imported as getSchedule)
export const getSchedule = getCampaignSchedule;

export const createScheduleEvent = async (
  id: string,
  data: Partial<ScheduleEvent>
): Promise<ScheduleEvent> => {
  const res = await api.post<{ data: ScheduleEvent }>(
    `/electoral/campaigns/${id}/schedule`,
    data
  );
  return res.data.data;
};

export const updateScheduleEvent = async (
  campaignId: string,
  eventId: string,
  data: Partial<ScheduleEvent>
): Promise<ScheduleEvent> => {
  const res = await api.patch<{ data: ScheduleEvent }>(
    `/electoral/campaigns/${campaignId}/schedule/${eventId}`,
    data
  );
  return res.data.data;
};

export const deleteScheduleEvent = async (campaignId: string, eventId: string): Promise<void> => {
  await api.delete(`/electoral/campaigns/${campaignId}/schedule/${eventId}`);
};

// ─── TSE Reports ──────────────────────────────────────────────────────────────

export const getTseReports = async (campaignId: string): Promise<TseReport[]> => {
  const res = await api.get<{ data: TseReport[] }>(
    `/electoral/campaigns/${campaignId}/tse-reports`
  );
  return res.data.data;
};

export const getTseReport = async (campaignId: string, reportId: string): Promise<TseReport> => {
  const res = await api.get<{ data: TseReport }>(
    `/electoral/campaigns/${campaignId}/tse-reports/${reportId}`
  );
  return res.data.data;
};

export const createTseReport = async (
  campaignId: string,
  data: Partial<TseReport>
): Promise<TseReport> => {
  const res = await api.post<{ data: TseReport }>(
    `/electoral/campaigns/${campaignId}/tse-reports`,
    data
  );
  return res.data.data;
};

export const updateTseReport = async (
  campaignId: string,
  reportId: string,
  data: Partial<TseReport>
): Promise<TseReport> => {
  const res = await api.patch<{ data: TseReport }>(
    `/electoral/campaigns/${campaignId}/tse-reports/${reportId}`,
    data
  );
  return res.data.data;
};

export const submitTseReport = async (
  campaignId: string,
  reportId: string
): Promise<void> => {
  await api.post(`/electoral/campaigns/${campaignId}/tse-reports/${reportId}/submit`);
};

// ─── TSE Report Items ─────────────────────────────────────────────────────────

export const getTseReportItems = async (
  campaignId: string,
  reportId: string
): Promise<TseReportItem[]> => {
  const res = await api.get<{ data: TseReportItem[] }>(
    `/electoral/campaigns/${campaignId}/tse-reports/${reportId}/items`
  );
  return res.data.data;
};

export const addTseReportItem = async (
  campaignId: string,
  reportId: string,
  data: Partial<TseReportItem>
): Promise<TseReportItem> => {
  const res = await api.post<{ data: TseReportItem }>(
    `/electoral/campaigns/${campaignId}/tse-reports/${reportId}/items`,
    data
  );
  return res.data.data;
};

// ─── TSE Codes ────────────────────────────────────────────────────────────────

export const getTseCodes = async (): Promise<TseCode[]> => {
  const res = await api.get<{ data: TseCode[] }>("/electoral/tse-codes");
  return res.data.data;
};
