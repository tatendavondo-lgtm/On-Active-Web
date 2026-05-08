import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Profile, AdminNotification } from '@/types';

interface AdminState {
  profile: Profile | null;
  isCollapsed: boolean;
  notifications: AdminNotification[];
  setProfile: (profile: Profile | null) => void;
  toggleCollapsed: () => void;
  addNotification: (n: AdminNotification) => void;
  markAllRead: () => void;
  getUnreadCount: () => number;
}

export const useAdmin = create<AdminState>()(
  persist(
    (set, get) => ({
      profile: null,
      isCollapsed: false,
      notifications: [],

      setProfile: (profile) => set({ profile }),

      toggleCollapsed: () => set((state) => ({ isCollapsed: !state.isCollapsed })),

      addNotification: (n) => set((state) => ({
        notifications: [n, ...state.notifications].slice(0, 50)
      })),

      markAllRead: () => set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true }))
      })),

      getUnreadCount: () => {
        return get().notifications.filter((n) => !n.read).length;
      }
    }),
    {
      name: 'on-active-admin',
      partialize: (state) => ({ isCollapsed: state.isCollapsed }), // Only persist sidebar state
    }
  )
);
