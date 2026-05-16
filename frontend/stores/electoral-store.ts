import { create } from "zustand";
import type { Election, Campaign } from "@/types/electoral";

interface ElectoralState {
  elections: Election[];
  campaigns: Campaign[];
  selectedCampaign: Campaign | null;
  isLoading: boolean;
  setElections: (elections: Election[]) => void;
  setCampaigns: (campaigns: Campaign[]) => void;
  setSelectedCampaign: (campaign: Campaign | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useElectoralStore = create<ElectoralState>((set) => ({
  elections: [],
  campaigns: [],
  selectedCampaign: null,
  isLoading: false,
  setElections: (elections) => set({ elections }),
  setCampaigns: (campaigns) => set({ campaigns }),
  setSelectedCampaign: (selectedCampaign) => set({ selectedCampaign }),
  setLoading: (isLoading) => set({ isLoading }),
}));
