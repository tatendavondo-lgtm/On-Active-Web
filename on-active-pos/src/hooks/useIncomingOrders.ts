/**
 * Hook for the TILL to receive salesman orders.
 *
 * When online: subscribe to Supabase Realtime on salesman_orders table
 * When offline: poll IndexedDB every 5 seconds for new salesman orders
 *
 * Returns: pending orders array + accept/cancel functions
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { db } from '../db/dexie';
import { useSessionStore } from '../stores/sessionStore';
import { useOnlineStatus } from './useOnlineStatus';
import { useNotificationStore } from '../stores/notificationStore';
import { playNotificationSound } from '../lib/notification';
import type { SalesmanOrder } from '../types/order';

export function useIncomingOrders() {
  const [orders, setOrders] = useState<SalesmanOrder[]>([]);
  const store = useSessionStore((s) => s.store);
  const isOnline = useOnlineStatus();
  const addNotification = useNotificationStore(s => s.addNotification);

  // Fetch from IndexedDB
  const loadLocal = useCallback(async () => {
    if (!store) return;
    const local = await db.salesmanOrders
      .where('store_id').equals(store.id)
      .and((o) => o.status === 'pending' || o.status === 'accepted')
      .sortBy('created_at');
    setOrders(local.reverse());
  }, [store]);

  useEffect(() => {
    loadLocal();

    // Poll locally every 5 seconds as fallback
    const interval = setInterval(loadLocal, 5000);

    // Subscribe to Realtime when online
    if (isOnline && store) {
      const subscription = supabase
        .channel('salesman-orders')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'salesman_orders',
          filter: `store_id=eq.${store.id}`,
        }, async (payload) => {
          // A new order arrived from a salesman via Supabase Realtime.
          // Write it into the till's own IndexedDB so it appears locally.
          const newOrder = payload.new as any;
          try {
            const exists = await db.salesmanOrders.get(newOrder.id);
            if (!exists) {
              await db.salesmanOrders.add({
                ...newOrder,
                salesman_name: newOrder.salesman_name || 'Unknown',
                items: newOrder.items || [],
                subtotal: newOrder.subtotal || 0,
                item_count: newOrder.item_count || 0,
                synced: true,
                device_id: '',
              });
            }
          } catch (e) {
            console.warn('Failed to write incoming order to local DB:', e);
          }
          
          // Fire notification + sound
          addNotification({
            type: 'incoming_order',
            title: 'New Salesman Order',
            message: `From ${newOrder.salesman_name || 'Unknown'} — ${(newOrder.items || []).length} items`,
            action: { label: 'View Queue', route: '/till' }
          });
          playNotificationSound.newIncomingOrder();

          // Refresh the local list
          loadLocal();
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'salesman_orders',
          filter: `store_id=eq.${store.id}`,
        }, () => {
          loadLocal();
        })
        .subscribe();

      return () => {
        clearInterval(interval);
        supabase.removeChannel(subscription);
      };
    }

    return () => clearInterval(interval);
  }, [store, isOnline, loadLocal, addNotification]);

  async function acceptOrder(orderId: string) {
    await db.salesmanOrders.update(orderId, {
      status: 'accepted',
    });
    // Queue sync to Supabase
    await db.syncQueue.add({
      table: 'salesman_orders',
      operation: 'update',
      data: { id: orderId, status: 'accepted' },
      created_at: new Date().toISOString(),
      attempts: 0,
    });
    loadLocal();
  }

  async function cancelOrder(orderId: string) {
    await db.salesmanOrders.update(orderId, { status: 'cancelled' });
    await db.syncQueue.add({
      table: 'salesman_orders',
      operation: 'update',
      data: { id: orderId, status: 'cancelled' },
      created_at: new Date().toISOString(),
      attempts: 0,
    });
    loadLocal();
  }

  async function completeOrder(orderId: string) {
    await db.salesmanOrders.update(orderId, {
      status: 'completed',
    });
    await db.syncQueue.add({
      table: 'salesman_orders',
      operation: 'update',
      data: { id: orderId, status: 'completed' },
      created_at: new Date().toISOString(),
      attempts: 0,
    });
    loadLocal();
  }

  return { orders, acceptOrder, cancelOrder, completeOrder, pendingCount: orders.filter(o => o.status === 'pending').length };
}
