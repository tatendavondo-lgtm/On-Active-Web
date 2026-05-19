'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Receipt } from 'lucide-react';
import type { PendingOrder } from '@/types';
import { StatusBadge } from '../ui/StatusBadge';
import { OrderSlideOver } from '../OrderSlideOver';
import { EmptyState } from '../ui/EmptyState';
import { formatUSD, formatRelativeTime, truncate } from '@/lib/admin/utils';

interface RecentOrdersTableProps {
  orders: PendingOrder[];
}

export function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  const [selected, setSelected] = useState<PendingOrder | null>(null);

  if (orders.length === 0) {
    return (
      <div className="bg-[#111] border border-[#1f1f1f] rounded-[8px]">
        <div className="px-6 py-4 border-b border-[#1f1f1f]">
          <h2 className="text-white font-bold text-sm">Recent Orders</h2>
        </div>
        <EmptyState icon={Receipt} title="No orders yet" description="Orders placed on the storefront will appear here." />
      </div>
    );
  }

  return (
    <>
      <div className="bg-[#111] border border-[#1f1f1f] rounded-[8px] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#1f1f1f] flex items-center justify-between">
          <h2 className="text-white font-bold text-sm">Recent Orders</h2>
          <span className="text-[#444] text-xs">{orders.length} shown</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1a1a1a]">
                {['Order Ref', 'Items', 'Total', 'Status', 'Time'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[#444] text-[11px] font-bold uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((order, i) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.035, duration: 0.25 }}
                  onClick={() => setSelected(order)}
                  className="border-b border-[#141414] hover:bg-[#161616] cursor-pointer transition-colors duration-150"
                >
                  <td className="px-4 py-3.5">
                    <span className="text-[#C5A021] text-sm font-mono font-semibold">
                      {order.order_ref}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-[#888] text-sm">
                      {truncate(order.items?.map((it) => it.name).join(', ') ?? '—', 32)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-white text-sm font-semibold">{formatUSD(order.total_usd)}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-[#444] text-xs">{formatRelativeTime(order.created_at)}</span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <OrderSlideOver order={selected} onClose={() => setSelected(null)} />
    </>
  );
}
