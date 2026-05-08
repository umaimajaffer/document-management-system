"use client";

import { create } from "zustand";

interface AppStore {
  sidebarOpen: boolean;
  notificationCount: number;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setNotificationCount: (count: number) => void;
  decrementNotificationCount: () => void;
  resetNotificationCount: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  sidebarOpen: true,
  notificationCount: 0,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setNotificationCount: (count) => set({ notificationCount: count }),
  decrementNotificationCount: () =>
    set((state) => ({ notificationCount: Math.max(0, state.notificationCount - 1) })),
  resetNotificationCount: () => set({ notificationCount: 0 }),
}));
