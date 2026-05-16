import { create } from "zustand";
import type { CrmTag, PipelineStage, CrmContact, CrmTask, CrmNotification, CrmKpis } from "@/types/crm";

interface CrmState {
  tags: CrmTag[];
  stages: PipelineStage[];
  contacts: CrmContact[];
  tasks: CrmTask[];
  notifications: CrmNotification[];
  unreadCount: number;
  kpis: CrmKpis | null;
  isLoading: boolean;
  setTags: (tags: CrmTag[]) => void;
  setStages: (stages: PipelineStage[]) => void;
  setContacts: (contacts: CrmContact[]) => void;
  setTasks: (tasks: CrmTask[]) => void;
  setNotifications: (notifications: CrmNotification[]) => void;
  setUnreadCount: (count: number) => void;
  setKpis: (kpis: CrmKpis) => void;
  setLoading: (loading: boolean) => void;
  updateContactStage: (contactId: string, stage: PipelineStage) => void;
}

export const useCrmStore = create<CrmState>((set) => ({
  tags: [],
  stages: [],
  contacts: [],
  tasks: [],
  notifications: [],
  unreadCount: 0,
  kpis: null,
  isLoading: false,
  setTags: (tags) => set({ tags }),
  setStages: (stages) => set({ stages }),
  setContacts: (contacts) => set({ contacts }),
  setTasks: (tasks) => set({ tasks }),
  setNotifications: (notifications) => set({ notifications }),
  setUnreadCount: (unreadCount) => set({ unreadCount }),
  setKpis: (kpis) => set({ kpis }),
  setLoading: (isLoading) => set({ isLoading }),
  updateContactStage: (contactId, stage) =>
    set((state) => ({
      contacts: state.contacts.map((c) =>
        c.id === contactId ? { ...c, stage } : c
      ),
    })),
}));
