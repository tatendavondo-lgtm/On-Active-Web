import { create } from 'zustand';

interface SettingsState {
  printerConnected: boolean;
  printerType: '58mm' | '80mm';
  setPrinter: (connected: boolean, type?: '58mm' | '80mm') => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  printerConnected: false,
  printerType: '80mm',
  setPrinter: (connected, type) =>
    set((s) => ({ printerConnected: connected, printerType: type || s.printerType })),
}));
