import { processSyncQueue } from '../db/sync';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/dexie';
import { useSessionStore } from '../stores/sessionStore';

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
      const session = useSessionStore.getState();

      // Update local DB
      const localUpdates: Record<string, any> = {
        status: newStatus,
        updated_at: now,
      };
      if (newStatus === 'completed') {
        localUpdates.completed_at = now;
        if (session.shiftId) localUpdates.shift_id = session.shiftId;
        if (session.employee?.id) localUpdates.employee_id = session.employee.id;
      }
      await db.orders.update(orderId, localUpdates as any);

      // Build valid remote columns for online_order_bridge
      const bridgeUpdate: Record<string, any> = {
        id: orderId,
        status: newStatus,
      };
      if (newStatus === 'preparing') bridgeUpdate.accepted_at = now;
      if (newStatus === 'ready') bridgeUpdate.ready_at = now;
      if (newStatus === 'completed') bridgeUpdate.completed_at = now;

      await db.syncQueue.add({
        table: 'online_order_bridge',
        operation: 'update',
        data: bridgeUpdate,
        created_at: now,
        attempts: 0
      });

      // When completed in the POS:
      // 1. Sync pending_orders status so Admin Hub and customer /order-confirmed page reflect completion
      // 2. Insert completed pos_orders record so Admin Hub webRevenue and POS End-of-Day reports count it
      // 3. Deduct stock quantity
      if (newStatus === 'completed') {
        if (order.webstore_order_id) {
          await db.syncQueue.add({
            table: 'pending_orders',
            operation: 'update',
            data: {
              id: order.webstore_order_id,
              status: 'confirmed',
              updated_at: now
            },
            created_at: now,
            attempts: 0
          });
        }

        if (session.employee?.id && session.shiftId) {
          await db.syncQueue.add({
            table: 'pos_orders',
            operation: 'insert',
            data: {
              id: order.id,
              order_number: order.order_number,
              store_id: order.store_id || session.store?.id,
              employee_id: session.employee.id,
              shift_id: session.shiftId,
              source: 'online',
              fulfillment: order.fulfillment || 'collection',
              status: 'completed',
              subtotal: order.total,
              auto_discount_applied: false,
              auto_discount_amount: 0,
              manual_discount_amount: 0,
              total_discount: 0,
              tax_amount: 0,
              total: order.total,
              currency: 'USD',
              created_at: order.created_at || now,
              completed_at: now,
            },
            created_at: now,
            attempts: 0
          });
        }

        if (order.items) {
          for (const item of order.items) {
            if (item.product_id) {
              try {
                const product = await db.products.get(item.product_id);
                if (product) {
                  if (item.variant_id) {
                    const vIndex = product.variants.findIndex(v => v.id === item.variant_id);
                    if (vIndex !== -1) {
                      product.variants[vIndex].stock = Math.max(0, product.variants[vIndex].stock - (item.quantity || 1));
                    }
                  } else if (product.variants.length > 0) {
                    product.variants[0].stock = Math.max(0, product.variants[0].stock - (item.quantity || 1));
                  }
                  await db.products.put(product);
                }
              } catch (err) {
                console.warn('Failed to update local inventory for online order item', item.product_id, err);
              }

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
      }
      // Immediately flush online order status & stock changes to Supabase
      processSyncQueue().catch(err => console.warn('Online order status sync deferred:', err));
    } catch (err) {
      console.error('Failed to move order status:', err);
    }
  };

  // Include both 'pending' and 'confirmed' (confirmed by Admin Hub) in the Pending column so orders never disappear
  const grouped = {
    pending: orders?.filter(o => o.status === 'pending' || o.status === 'confirmed') || [],
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
