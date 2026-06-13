/**
 * Hook for the TILL to receive salesman orders.
 *
 * When online: subscribe to Supabase Realtime on salesman_orders table
 * When offline: poll IndexedDB every 5 seconds for new salesman orders
 *
 * Returns: pending orders array + accept/cancel functions
 */

import { useEffect, useState, useCallback, useRef } from 'react';
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
  const clearIncomingOrders = useNotificationStore(s => s.clearIncomingOrders);

  const isInitialMount = useRef(true);
  const notifiedIds = useRef<Set<string>>(new Set());

  // Fetch from IndexedDB
  const loadLocal = useCallback(async () => {
    if (!store) return;
    const local = await db.salesmanOrders
      .where('store_id').equals(store.id)
      .and((o) => o.status === 'pending' || o.status === 'accepted')
      .sortBy('created_at');

    const pending = local.filter(o => o.status === 'pending');

    if (isInitialMount.current) {
      // Just populate initial set without triggering sound
      notifiedIds.current = new Set(pending.map(o => o.id));
      isInitialMount.current = false;
    } else {
      let newlyAdded = false;

      pending.forEach(order => {
        if (!notifiedIds.current.has(order.id)) {
          notifiedIds.current.add(order.id);
          newlyAdded = true;
          addNotification({
            type: 'incoming_order',
            title: 'New Salesman Order',
            message: `From ${order.salesman_name || 'Unknown'} — ${order.item_count || 0} items`,
            action: { label: 'View Queue', route: '/till' }
          });
        }
      });

      if (newlyAdded) {
        playNotificationSound.newIncomingOrder();
      }
    }

    setOrders(local.reverse());
  }, [store, addNotification]);

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
                items: typeof newOrder.items === 'string' ? JSON.parse(newOrder.items) : (newOrder.items || []),
                subtotal: newOrder.subtotal || 0,
                item_count: newOrder.item_count || 0,
                synced: true,
                device_id: '',
              });
            }
          } catch (e) {
            console.warn('Failed to write incoming order to local DB:', e);
          }

          // Refresh the local list
          loadLocal();
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'salesman_orders',
          filter: `store_id=eq.${store.id}`,
        }, async (payload) => {
          const updatedOrder = payload.new as any;
          try {
            await db.salesmanOrders.update(updatedOrder.id, {
              status: updatedOrder.status,
              items: typeof updatedOrder.items === 'string' ? JSON.parse(updatedOrder.items) : (updatedOrder.items || []),
              subtotal: updatedOrder.subtotal || 0,
              item_count: updatedOrder.item_count || 0,
            });
          } catch (e) {
            console.warn('Failed to update local incoming order:', e);
          }
          loadLocal();
        })
        .subscribe();

      return () => {
        clearInterval(interval);
        supabase.removeChannel(subscription);
      };
    }

    return () => clearInterval(interval);
  }, [store, isOnline, loadLocal]);

  async function acceptOrder(orderId: string) {
    clearIncomingOrders();
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
    clearIncomingOrders();
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
    clearIncomingOrders();
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
