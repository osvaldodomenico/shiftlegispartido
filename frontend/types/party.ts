export type ChapterLevel = "nacional" | "estadual" | "municipal" | "zonal";
export type MandateStatus = "active" | "inactive" | "suspended";

export interface PartyChapter {
  id: string;
  name: string;
  level: ChapterLevel;
  parent_id?: string;
  children?: PartyChapter[];
  member_count?: number;
  state?: string;
  city?: string;
}

export interface ChapterMember {
  id: string;
  person: { id: string; name: string };
  role?: string;
  joined_at: string;
}

export interface PartyOrgan {
  id: string;
  name: string;
  description?: string;
  member_count?: number;
}

export interface OrganMember {
  id: string;
  person: { id: string; name: string };
  role?: string;
  joined_at: string;
}

export interface Mandate {
  id: string;
  person: { id: string; name: string };
  office: string;
  jurisdiction: string;
  start_date: string;
  end_date?: string;
  status: MandateStatus;
}
