'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Receipt, CheckCircle, XCircle, Eye, MonitorSmartphone, Store, Globe } from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';
import { OrderSlideOver } from '../OrderSlideOver';
import { ConfirmModal } from '../ConfirmModal';
import { EmptyState } from '../ui/EmptyState';
import { TableRowSkeleton } from '../ui/SkeletonLoader';
import { formatUSD, formatDate } from '@/lib/admin/utils';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export type UnifiedOrderSource = 'webstore' | 'pos_walk_in' | 'pos_salesman';

export interface UnifiedOrder {
  id: string;
  order_ref: string;
  source: UnifiedOrderSource;
  status: any;
  total_usd: number;
  created_at: string;
  items: any[];
  // POS Specific
  pos_data?: {
    till_operator?: string;
    salesman?: string;
    payment_method?: string;
    currency?: string;
    amount_paid?: number;
    exchange_rate?: number;
    auto_discount_applied?: boolean;
    auto_discount_amount?: number;
  };
  // Webstore specific
  delivery_fee_usd?: number;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  fulfillment?: string | null;
}

interface OrderFiltersValue {
  status: string | 'all';
  search: string;
}

export function OrdersTable({ filters, userRole }: { filters: OrderFiltersValue; userRole: string }) {
  const [orders, setOrders] = useState<UnifiedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<'all' | 'web' | 'pos_walk_in' | 'pos_salesman' | 'online'>('all');
  
  const [selected, setSelected] = useState<UnifiedOrder | null>(null);
  const [cancelTarget, setCancelTarget] = useState<UnifiedOrder | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [zigRate, setZigRate] = useState(13.5);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    
    try {
      const res = await fetch('/api/admin/orders');
      if (!res.ok) throw new Error('Failed to fetch orders');
      
      const { webOrders, posOrders, zigRate: rate } = await res.json();
      setZigRate(rate);

      let unified: UnifiedOrder[] = [];

      // Process Webstore Orders
      if (webOrders) {
        unified.push(...webOrders.map((w: any) => ({
          id: w.id,
          order_ref: w.order_ref,
          source: 'webstore' as UnifiedOrderSource,
          status: w.status,
          total_usd: w.total_usd,
          created_at: w.created_at,
          items: w.items || [],
          delivery_fee_usd: w.delivery_fee_usd,
          customer_name: w.customer_name,
          customer_phone: w.customer_phone,
          customer_email: w.customer_email,
          fulfillment: w.fulfillment
        })));
      }

      // Process POS Orders
      if (posOrders) {
        unified.push(...posOrders.map((p: any) => ({
          id: p.id,
          order_ref: p.order_number,
          source: p.source === 'salesman' ? 'pos_salesman' as UnifiedOrderSource : 'pos_walk_in' as UnifiedOrderSource,
          status: p.status,
          total_usd: p.total,
          created_at: p.created_at,
          items: [], // Will fetch in OrderSlideOver if needed
          pos_data: {
            till_operator: p.employee?.full_name,
            salesman: p.salesman?.full_name,
            payment_method: p.payment_method,
            currency: p.currency,
            amount_paid: p.amount_paid,
            exchange_rate: p.exchange_rate,
            auto_discount_applied: p.auto_discount_applied,
            auto_discount_amount: p.auto_discount_amount
          }
        })));
      }

      // Sort combined by date
      unified.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      
      setOrders(unified);
    } catch (error) {
      console.error("Failed to fetch orders", error);
      toast.error('Failed to load combined orders');
    }
    
    setLoading(false);
  }, []);

  useEffect(() => { 
    fetchOrders(); 
    // Basic polling or refresh could be added here, leaving out realtime channel for brevity
  }, [fetchOrders]);

  const handleConfirm = async (orderId: string, source: string) => {
    if (source !== 'webstore') return;
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: 'confirmed' }),
      });
      if (!res.ok) throw new Error('Failed to confirm order');
      toast.success('Order confirmed');
      fetchOrders();
    } catch {
      toast.error('Failed to confirm order');
    }
  };

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      // Source filter
      if (sourceFilter === 'web' && o.source !== 'webstore') return false;
      if (sourceFilter === 'pos_walk_in' && o.source !== 'pos_walk_in') return false;
      if (sourceFilter === 'pos_salesman' && o.source !== 'pos_salesman') return false;
      if (sourceFilter === 'online' && o.source !== 'webstore') return false; // same for now
      
      // Status filter
      if (filters.status !== 'all' && o.status !== filters.status) return false;
      
      // Search filter
      if (filters.search && !o.order_ref.toLowerCase().includes(filters.search.toLowerCase())) return false;
      
      return true;
    });
  }, [orders, filters, sourceFilter]);

  const getSourceIcon = (source: string) => {
    if (source === 'webstore') return <Globe size={13} className="text-[#00b4ff]" />;
    if (source === 'pos_walk_in') return <Store size={13} className="text-[#C5A021]" />;
    return <MonitorSmartphone size={13} className="text-[#a855f7]" />;
  };

  const getSourceLabel = (source: string) => {
    if (source === 'webstore') return 'Webstore';
    if (source === 'pos_walk_in') return 'Walk-in';
    return 'Salesman';
  };

  if (loading) {
    return (
      <div className="bg-[#111] border border-[#1f1f1f] rounded-[8px] overflow-hidden">
        <table className="w-full"><tbody>{[1,2,3,4,5].map(i=><TableRowSkeleton key={i} cols={7}/>)}</tbody></table>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Source Tabs */}
      <div className="flex items-center gap-2 p-1 bg-[#111] border border-[#1f1f1f] rounded-[8px] w-fit overflow-x-auto">
        {[
          { id: 'all', label: 'All Orders' },
          { id: 'web', label: 'Webstore' },
          { id: 'pos_walk_in', label: 'POS Walk-in' },
          { id: 'pos_salesman', label: 'POS Salesman' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSourceFilter(tab.id as any)}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-[6px] transition-colors whitespace-nowrap ${
              sourceFilter === tab.id 
                ? 'bg-[#1a1a1a] text-white' 
                : 'text-[#666] hover:text-[#aaa] hover:bg-[#1a1a1a]/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-[#111] border border-[#1f1f1f] rounded-[8px] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#1a1a1a] flex items-center justify-between">
          <span className="text-[#444] text-xs">{filtered.length} orders</span>
        </div>
        
        {filtered.length === 0 ? (
          <EmptyState icon={Receipt} title="No orders found" description="Try adjusting your filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#181818]">
                  {['Order Ref', 'Source', 'Total', 'Status', 'Date', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[#444] text-[11px] font-bold uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((order, i) => (
                  <motion.tr
                    key={`${order.source}-${order.id}`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.025, duration: 0.2 }}
                    className="border-b border-[#141414] hover:bg-[#161616] transition-colors duration-100"
                  >
                    <td className="px-4 py-3.5">
                      <span className="text-white font-mono text-sm font-semibold">{order.order_ref}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 bg-[#1a1a1a] w-fit px-2 py-1 rounded-[4px]">
                        {getSourceIcon(order.source)}
                        <span className="text-[#888] text-[10px] font-bold uppercase tracking-wider">
                          {getSourceLabel(order.source)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-white text-sm font-semibold">{formatUSD(order.total_usd)}</span>
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
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        {order.status === 'pending' && order.source === 'webstore' && (
                          <button
                            onClick={() => handleConfirm(order.id, order.source)}
                            className="p-1.5 text-[#C5A021]/50 hover:text-[#C5A021] hover:bg-[#C5A021]/10 rounded-[4px] transition-colors"
                          >
                            <CheckCircle size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <OrderSlideOver order={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
