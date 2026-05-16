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
