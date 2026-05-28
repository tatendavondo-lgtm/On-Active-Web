import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'incoming_order' | 'online_order';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  action?: { label: string; route: string };
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  removeNotification: (id: string) => void;
  clearIncomingOrders: () => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    immer((set) => ({
      notifications: [],
      unreadCount: 0,
      addNotification: (n) =>
        set((state) => {
          const id = crypto.randomUUID();
          const timestamp = new Date().toISOString();
          state.notifications.unshift({ ...n, id, timestamp, read: false });
          state.unreadCount += 1;
        }),
      markRead: (id) =>
        set((state) => {
          const n = state.notifications.find((notif) => notif.id === id);
          if (n && !n.read) {
            n.read = true;
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
        }),
      markAllRead: () =>
        set((state) => {
          state.notifications.forEach((n) => (n.read = true));
          state.unreadCount = 0;
        }),
      removeNotification: (id) =>
        set((state) => {
          const idx = state.notifications.findIndex((n) => n.id === id);
          if (idx !== -1) {
            const wasUnread = !state.notifications[idx].read;
            state.notifications.splice(idx, 1);
            if (wasUnread) state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
        }),
      clearIncomingOrders: () =>
        set((state) => {
          state.notifications.forEach((n) => {
            if (n.type === 'incoming_order' && !n.read) {
              n.read = true;
              state.unreadCount = Math.max(0, state.unreadCount - 1);
            }
          });
        }),
      clearAll: () =>
        set((state) => {
          state.notifications = [];
          state.unreadCount = 0;
        }),
    })),
    {
      name: 'pos-notifications',
      partialize: (state) => ({
        notifications: state.notifications.slice(0, 50), // Keep last 50 only
        unreadCount: state.unreadCount,
      }),
    }
  )
);
