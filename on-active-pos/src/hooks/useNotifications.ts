import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/dexie';
import { useNotificationStore } from '../stores/notificationStore';
import { playNotificationSound } from '../lib/notification';
import { useSessionStore } from '../stores/sessionStore';
import { isSalesmanRole } from '../types/employee';

export function useNotificationListener() {
  const { employee, store } = useSessionStore();
  const addNotification = useNotificationStore(s => s.addNotification);

  // Monitor salesman orders (for till operator)
  useLiveQuery(async () => {
    if (!employee || isSalesmanRole(employee.role)) return;

    const latest = await db.salesmanOrders
      .where('store_id')
      .equals(store?.id || '')
      .reverse()
      .limit(1)
      .toArray();

    if (latest.length > 0) {
      const order = latest[0];
      const lastNotified = localStorage.getItem('last_notified_salesman_order');
      
      if (order.id !== lastNotified && order.status === 'pending') {
        localStorage.setItem('last_notified_salesman_order', order.id);
        
        addNotification({
          type: 'incoming_order',
          title: 'New Salesman Order',
          message: `From ${order.salesman_name} — ${order.items.length} items`,
          action: { label: 'View Queue', route: '/till' }
        });
        playNotificationSound.newIncomingOrder();
      }
    }
  }, [employee, store]);

  // Monitor online orders
  useLiveQuery(async () => {
    if (!employee || isSalesmanRole(employee.role)) return;

    const latest = await db.orders
      .where('source')
      .equals('online')
      .reverse()
      .limit(1)
      .toArray();

    if (latest.length > 0) {
      const order = latest[0];
      const lastNotified = localStorage.getItem('last_notified_online_order');
      
      if (order.id !== lastNotified && order.status === 'pending') {
        localStorage.setItem('last_notified_online_order', order.id);
        
        const orderNum = order.order_number || 'UNKNOWN';
        const shortId = typeof orderNum === 'string' && orderNum.includes('-') 
          ? orderNum.split('-').pop() 
          : orderNum;

        addNotification({
          type: 'online_order',
          title: 'New Online Order',
          message: `#${shortId} — ${order.fulfillment || 'Pending'}`,
          action: { label: 'View Kanban', route: '/till/online-orders' }
        });
        playNotificationSound.newOnlineOrder();
      }
    }
  }, [employee, store]);
}
