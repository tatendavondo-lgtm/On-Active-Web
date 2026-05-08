'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAdmin } from '@/store/admin';
import toast from 'react-hot-toast';
import { formatUSD } from '@/lib/admin/utils';
import type { AdminNotification, PendingOrder } from '@/types';

export function NotificationSystem() {
  const { addNotification } = useAdmin();

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel('admin-order-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pending_orders' },
        (payload) => {
          const order = payload.new as PendingOrder;
          const notification: AdminNotification = {
            id: `order-${order.id}-${Date.now()}`,
            type: 'new_order',
            title: `New Order ${order.order_ref}`,
            message: `${formatUSD(order.total_usd)} Â· ${order.items?.length ?? 1} item(s)`,
            timestamp: Date.now(),
            read: false,
          };

          addNotification(notification);

          toast.custom(
            () => (
              <div className="flex items-start gap-3 px-4 py-3 bg-[#111] border border-[#C5A021]/25 rounded-[6px] shadow-2xl max-w-xs w-full">
                <div className="w-2 h-2 bg-[#C5A021] rounded-full mt-1.5 flex-shrink-0 animate-pulse" />
                <div className="min-w-0">
                  <p className="text-white text-sm font-semibold">{notification.title}</p>
                  <p className="text-[#777] text-xs mt-0.5">{notification.message}</p>
                </div>
              </div>
            ),
            { duration: 6000, position: 'top-right' }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [addNotification]);

  return null;
}
