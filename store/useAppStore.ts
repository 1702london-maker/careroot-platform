import { create } from "zustand";
import type { User, Organisation, Client } from "@/types";

interface AppStore {
  user: User | null;
  organisation: Organisation | null;
  currentClient: Client | null;
  sidebarOpen: boolean;

  setUser: (user: User | null) => void;
  setOrganisation: (org: Organisation | null) => void;
  setCurrentClient: (client: Client | null) => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  user: null,
  organisation: null,
  currentClient: null,
  sidebarOpen: false,

  setUser: (user) => set({ user }),
  setOrganisation: (organisation) => set({ organisation }),
  setCurrentClient: (currentClient) => set({ currentClient }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
}));
