// ─── Enums ────────────────────────────────────────────────────────────────────

export type CampaignStatus = "planning" | "active" | "finished";
export type TeamMemberRole = "coordenador" | "cabo_eleitoral" | "voluntario" | "assessor";
export type TeamMemberPaymentType = "paid" | "volunteer";
export type ContractStatus = "draft" | "active" | "finished" | "cancelled";
export type ScheduleEventType = "corpo_a_corpo" | "comicio" | "debate" | "reuniao" | "outro";
export type ScheduleEventStatus = "scheduled" | "done" | "cancelled";
export type TseItemType = "receita" | "despesa";
export type TseReportStatus = "draft" | "submitted" | "accepted" | "rejected";

// Legacy alias kept for backward compat
export type TseReportType = TseItemType;

// ─── Core Entities ────────────────────────────────────────────────────────────

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
  /** TSE compliance: CNPJ or CPF of supplier */
  supplier_document?: string;
  /** TSE compliance: invoice/receipt number */
  invoice_number?: string;
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

// ─── TSE Prestação de Contas ──────────────────────────────────────────────────

export interface TseCode {
  id: string;
  code: string;
  description: string;
  type: TseItemType;
}

export interface TseReportItem {
  id: string;
  tse_code: TseCode;
  type: TseItemType;
  description: string;
  amount: number;
  date: string;
  /** CNPJ/CPF of supplier or donor */
  document?: string;
  /** Invoice or receipt reference */
  invoice_ref?: string;
}

export interface TseReport {
  id: string;
  campaign_id: string;
  /** Partial or final report */
  is_final: boolean;
  status: TseReportStatus;
  period_start: string;
  period_end: string;
  submitted_at?: string;
  /** Computed totals (may be returned by API) */
  total_receitas?: number;
  total_despesas?: number;
  items?: TseReportItem[];
}
