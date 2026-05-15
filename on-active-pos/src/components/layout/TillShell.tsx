import type { ReactNode } from 'react';
import { TillSidebar } from './TillSidebar';
import { StatusBar } from './StatusBar';
import { OfflineBanner } from '../shared/OfflineBanner';
import { OpenShiftModal } from '../till/OpenShiftModal';
import { useSessionStore } from '../../stores/sessionStore';
import { db } from '../../db/dexie';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

export function TillShell({ children }: { children: ReactNode }) {
  const { shiftId, setShiftId, employee, store, deviceId } = useSessionStore() as any;
  useKeyboardShortcuts();

  const handleOpenShift = async (openingCash: number) => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const shiftData = {
      id,
      store_id: store.id,
      employee_id: employee.id,
      device_id: deviceId,
      opened_at: now,
      opening_cash: openingCash,
      status: 'open' as const
    };

    // Save locally
    await db.shifts.add(shiftData);
    
    // Add to sync queue
    await db.syncQueue.add({
      table: 'pos_shifts',
      operation: 'insert',
      data: shiftData,
      created_at: now,
      attempts: 0
    });

    setShiftId(id);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <OfflineBanner />
      <StatusBar />
      <div className="flex flex-1 overflow-hidden">
        <TillSidebar />
        <main className="flex-1 bg-[var(--pos-bg)] relative overflow-hidden">
          {children}
        </main>
      </div>
      <OpenShiftModal isOpen={!shiftId} onOpen={handleOpenShift} />
    </div>
  );
}
