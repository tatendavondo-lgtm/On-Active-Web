'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Receipt, CheckCircle, XCircle, Eye } from 'lucide-react';
import type { PendingOrder, OrderStatus } from '@/types';
import { StatusBadge } from '../ui/StatusBadge';
import { OrderSlideOver } from '../OrderSlideOver';
import { ConfirmModal } from '../ConfirmModal';
import { EmptyState } from '../ui/EmptyState';
import { TableRowSkeleton } from '../ui/SkeletonLoader';
import { formatUSD, formatDate } from '@/lib/admin/utils';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

interface OrderFiltersValue {
  status: OrderStatus | 'all';
  search: string;
}

interface OrdersTableProps {
  filters: OrderFiltersValue;
  userRole: string;
}

export function OrdersTable({ filters, userRole }: OrdersTableProps) {
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PendingOrder | null>(null);
  const [cancelTarget, setCancelTarget] = useState<PendingOrder | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    let query = supabase
      .from('pending_orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (filters.status !== 'all') query = query.eq('status', filters.status);
    const { data, error } = await query;
    if (error) toast.error('Failed to load orders');
    else setOrders(data ?? []);
    setLoading(false);
  }, [filters.status]);

  useEffect(() => { 
    fetchOrders(); 
    
    const supabase = createClient();
    const channel = supabase
      .channel('new-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pending_orders' },
        (payload) => {
          fetchOrders();
          if (payload.eventType === 'INSERT') {
            toast('New order received!', { icon: '📦' });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders]);

  const handleConfirm = async (orderId: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('pending_orders')
      .update({ status: 'confirmed', updated_at: new Date().toISOString() })
      .eq('id', orderId);
    if (error) {
      toast.error('Failed to confirm order');
      return;
    }

    toast.success('Order confirmed');

    // Bridge to POS — fetch default store and bridge the order
    try {
      const { data: stores } = await supabase
        .from('stores')
        .select('id')
        .eq('is_active', true)
        .limit(1);

      if (stores && stores.length > 0) {
        await fetch('/api/admin/bridge-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            storeId: stores[0].id,
            fulfillment: 'collection',
          }),
        });
      }
    } catch (bridgeErr) {
      // Non-blocking — order is confirmed even if bridge fails
      console.warn('Bridge to POS failed:', bridgeErr);
    }

    fetchOrders();
  };

  const handleCancel = async (orderId: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('pending_orders')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', orderId);
    if (error) toast.error('Failed to cancel order');
    else { toast.success('Order cancelled'); setCancelTarget(null); fetchOrders(); }
  };

  const filtered = orders.filter((o) => {
    if (!filters.search) return true;
    return o.order_ref.toLowerCase().includes(filters.search.toLowerCase());
  });

  if (loading) {
    return (
      <div className="bg-[#111] border border-[#1f1f1f] rounded-[8px] overflow-hidden">
        <table className="w-full"><tbody>{[1,2,3,4,5].map(i=><TableRowSkeleton key={i} cols={6}/>)}</tbody></table>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="bg-[#111] border border-[#1f1f1f] rounded-[8px]">
        <EmptyState icon={Receipt} title="No orders found" description="Try adjusting your filters." />
      </div>
    );
  }

  return (
    <>
      <div className="bg-[#111] border border-[#1f1f1f] rounded-[8px] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#1a1a1a] flex items-center justify-between">
          <span className="text-[#444] text-xs">{filtered.length} orders</span>
          {selectedIds.size > 0 && userRole === 'owner' && (
            <div className="flex items-center gap-2">
              <span className="text-[#555] text-xs">{selectedIds.size} selected</span>
              <button
                onClick={async () => {
                  const supabase = createClient();
                  await supabase.from('pending_orders').update({ status: 'confirmed' }).in('id', [...selectedIds]);
                  toast.success(`${selectedIds.size} orders confirmed`);
                  setSelectedIds(new Set());
                  fetchOrders();
                }}
                className="px-3 py-1.5 bg-[#C5A021]/15 text-[#C5A021] text-xs font-bold rounded-[4px] hover:bg-[#C5A021]/25 transition-colors"
              >
                Bulk Confirm
              </button>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#181818]">
                {userRole === 'owner' && <th className="w-10 px-4 py-3" />}
                {['Order Ref', 'Items', 'Total USD', 'ZiG', 'Status', 'Date', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[#444] text-[11px] font-bold uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((order, i) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.025, duration: 0.2 }}
                  className="border-b border-[#141414] hover:bg-[#161616] transition-colors duration-100"
                >
                  {userRole === 'owner' && (
                    <td className="px-4 py-3.5">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(order.id)}
                        onChange={(e) => {
                          const next = new Set(selectedIds);
                          e.target.checked ? next.add(order.id) : next.delete(order.id);
                          setSelectedIds(next);
                        }}
                        className="accent-[#C5A021]"
                      />
                    </td>
                  )}
                  <td className="px-4 py-3.5">
                    <span className="text-[#C5A021] font-mono text-sm font-semibold">{order.order_ref}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-[#666] text-sm">{order.items?.length ?? 0} item(s)</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-white text-sm font-semibold">{formatUSD(order.total_usd)}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-[#444] text-xs">ZiG {Math.round(order.total_usd * 13500).toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-[#444] text-xs whitespace-nowrap">{formatDate(order.created_at)}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSelected(order)}
                        className="p-1.5 text-[#444] hover:text-white hover:bg-[#1f1f1f] rounded-[4px] transition-colors"
                        title="View"
                      >
                        <Eye size={14} />
                      </button>
                      {order.status === 'pending' && (
                        <button
                          onClick={() => handleConfirm(order.id)}
                          className="p-1.5 text-[#C5A021]/50 hover:text-[#C5A021] hover:bg-[#C5A021]/10 rounded-[4px] transition-colors"
                          title="Confirm"
                        >
                          <CheckCircle size={14} />
                        </button>
                      )}
                      {userRole === 'owner' && order.status !== 'cancelled' && (
                        <button
                          onClick={() => setCancelTarget(order)}
                          className="p-1.5 text-red-500/40 hover:text-red-400 hover:bg-red-500/10 rounded-[4px] transition-colors"
                          title="Cancel"
                        >
                          <XCircle size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <OrderSlideOver order={selected} onClose={() => setSelected(null)} />
      <ConfirmModal
        isOpen={!!cancelTarget}
        danger
        title="Cancel order?"
        message={`This will permanently cancel ${cancelTarget?.order_ref}. This cannot be undone.`}
        confirmLabel="Cancel Order"
        onConfirm={() => cancelTarget && handleCancel(cancelTarget.id)}
        onCancel={() => setCancelTarget(null)}
      />
    </>
  );
}
