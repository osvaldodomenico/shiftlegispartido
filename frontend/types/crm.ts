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
