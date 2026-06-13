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
    try {
      const order = await db.orders.get(orderId);
      if (!order || order.status === newStatus) return;

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

      // Deduct stock quantity when completed in the POS
      if (newStatus === 'completed' && order.items) {
        for (const item of order.items) {
          if (item.product_id) {
            // A. Local stock deduction for immediate UI updates
            try {
              const product = await db.products.get(item.product_id);
              if (product) {
                if (item.variant_id) {
                  const vIndex = product.variants.findIndex(v => v.id === item.variant_id);
                  if (vIndex !== -1) {
                    product.variants[vIndex].stock = Math.max(0, product.variants[vIndex].stock - (item.quantity || 1));
                  }
                } else {
                  if (product.variants.length > 0) {
                    product.variants[0].stock = Math.max(0, product.variants[0].stock - (item.quantity || 1));
                  }
                }
                await db.products.put(product);
              }
            } catch (err) {
              console.warn('Failed to update local inventory for online order item', item.product_id, err);
            }

            // B. Queue for remote sync
            await db.syncQueue.add({
              table: 'products',
              operation: 'update',
              data: {
                id: item.product_id,
                product_id: item.product_id,
                variant_id: item.variant_id || null,
                store_id: order.store_id,
                decrement: item.quantity || 1,
              },
              created_at: now,
              attempts: 0
            });
          }
        }
      }
    } catch (err) {
      console.error('Failed to move order status:', err);
    }
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
