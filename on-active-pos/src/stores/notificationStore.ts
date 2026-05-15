import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

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
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>()(
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
    clearAll: () =>
      set((state) => {
        state.notifications = [];
        state.unreadCount = 0;
      }),
  }))
);
