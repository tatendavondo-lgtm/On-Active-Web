import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/dexie';

export function useOnlineOrders() {
  const orders = useLiveQuery(
    () => db.orders
      .where('source')
      .equals('online')
      .toArray(),
    []
  );

  const moveToStatus = async (orderId: string, newStatus: string) => {
    const now = new Date().toISOString();
    
    // Update local DB
    await db.orders.update(orderId, { 
      status: newStatus,
      updated_at: now
    } as any);

    // Add to sync queue for backend update
    await db.syncQueue.add({
      table: 'online_order_bridge',
      operation: 'update',
      data: { id: orderId, status: newStatus, updated_at: now },
      created_at: now,
      attempts: 0
    });
  };

  const grouped = {
    pending: orders?.filter(o => o.status === 'pending') || [],
    preparing: orders?.filter(o => o.status === 'preparing') || [],
    ready: orders?.filter(o => o.status === 'ready') || [],
    completed: orders?.filter(o => o.status === 'completed' || o.status === 'collected' || o.status === 'delivered') || []
  };

  const stats = {
    pending: grouped.pending.length,
    preparing: grouped.preparing.length,
    ready: grouped.ready.length,
    completedToday: grouped.completed.filter(o => {
      const today = new Date().toDateString();
      return new Date(o.created_at).toDateString() === today;
    }).length
  };

  return {
    orders,
    grouped,
    stats,
    moveToStatus
  };
}
