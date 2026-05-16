import { create } from "zustand";
import type { PartyChapter, PartyOrgan, Mandate } from "@/types/party";

interface PartyState {
  chapters: PartyChapter[];
  organs: PartyOrgan[];
  mandates: Mandate[];
  isLoading: boolean;
  setChapters: (chapters: PartyChapter[]) => void;
  setOrgans: (organs: PartyOrgan[]) => void;
  setMandates: (mandates: Mandate[]) => void;
  setLoading: (loading: boolean) => void;
}

export const usePartyStore = create<PartyState>((set) => ({
  chapters: [],
  organs: [],
  mandates: [],
  isLoading: false,
  setChapters: (chapters) => set({ chapters }),
  setOrgans: (organs) => set({ organs }),
  setMandates: (mandates) => set({ mandates }),
  setLoading: (isLoading) => set({ isLoading }),
}));
