import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Employee } from '../types/employee';
import type { Store } from '../types/store';
import { DEVICE_ID_KEY } from '../config/constants';

interface SessionState {
  employee: Employee | null;
  store: Store | null;
  shiftId: string | null;
  deviceId: string;
  isAuthenticated: boolean;
  login: (employee: Employee, store: Store, shiftId: string | null) => void;
  setShiftId: (id: string | null) => void;
  logout: () => void;
}

function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      employee: null,
      store: null,
      shiftId: null,
      deviceId: getDeviceId(),
      isAuthenticated: false,
      login: (employee, store, shiftId) =>
        set({ employee, store, shiftId, isAuthenticated: true }),
      setShiftId: (id) => set({ shiftId: id }),
      logout: () =>
        set({ employee: null, store: null, shiftId: null, isAuthenticated: false }),
    }),
    {
      name: 'pos-session',
      // Only persist auth-critical fields, not functions
      partialize: (state) => ({
        employee: state.employee,
        store: state.store,
        shiftId: state.shiftId,
        isAuthenticated: state.isAuthenticated,
        deviceId: state.deviceId,
      }),
    }
  )
);
