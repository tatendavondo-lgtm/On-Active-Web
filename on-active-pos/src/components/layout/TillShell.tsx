import { processSyncQueue } from '../../db/sync';
import { logPosAction } from '../../lib/audit';
import type { ReactNode } from 'react';
import { TillSidebar } from './TillSidebar';
import { StatusBar } from './StatusBar';
import { OfflineBanner } from '../shared/OfflineBanner';
import { OpenShiftModal } from '../till/OpenShiftModal';
import { useSessionStore } from '../../stores/sessionStore';
import { db } from '../../db/dexie';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

import { generateUUID } from '../../lib/uuid';

export function TillShell({ children }: { children: ReactNode }) {
  const { shiftId, setShiftId, employee, store, deviceId } = useSessionStore() as any;
  useKeyboardShortcuts();

  const handleOpenShift = async (openingCash: number) => {
    const id = generateUUID();
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
      table: 'shifts',
      operation: 'insert',
      data: shiftData,
      created_at: now,
      attempts: 0
    });

    setShiftId(id);
    processSyncQueue().catch(err => console.warn('Shift open sync deferred:', err));
    if (employee && store) {
      logPosAction({
        userId: employee.id,
        userName: employee.full_name,
        userRole: employee.role,
        action: 'open_shift',
        targetType: 'shift',
        targetId: id,
        details: { opening_cash: openingCash },
        storeId: store.id,
      });
    }
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
