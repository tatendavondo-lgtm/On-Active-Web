'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Package } from 'lucide-react';
import type { PendingOrder } from '@/types';
import { StatusBadge } from './ui/StatusBadge';
import { formatUSD, formatDate } from '@/lib/admin/utils';

interface OrderSlideOverProps {
  order: PendingOrder | null;
  onClose: () => void;
}

export function OrderSlideOver({ order, onClose }: OrderSlideOverProps) {
  return (
    <AnimatePresence>
      {order && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 h-full w-full max-w-[420px] bg-[#0d0d0d] border-l border-[#1f1f1f] z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f1f1f] flex-shrink-0">
              <div>
                <h2 className="text-white font-bold text-base">{order.order_ref}</h2>
                <p className="text-[#444] text-xs mt-0.5">{formatDate(order.created_at)}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={order.status} />
                <button
                  onClick={onClose}
                  className="p-2 text-[#444] hover:text-white transition-colors rounded-[6px] hover:bg-[#1a1a1a]"
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Items */}
              <div>
                <p className="text-[#444] text-[11px] font-bold uppercase tracking-widest mb-3">
                  Items ({order.items?.length ?? 0})
                </p>
                <div className="space-y-2">
                  {order.items?.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 bg-[#111] border border-[#1a1a1a] rounded-[6px]"
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-11 h-11 object-cover rounded-[4px] flex-shrink-0 bg-[#1a1a1a]"
                        />
                      ) : (
                        <div className="w-11 h-11 bg-[#1a1a1a] rounded-[4px] flex items-center justify-center flex-shrink-0">
                          <Package size={14} className="text-[#333]" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{item.name}</p>
                        <p className="text-[#444] text-xs">
                          Size {item.size} · Qty {item.quantity}
                        </p>
                      </div>
                      <p className="text-white text-sm font-semibold flex-shrink-0">
                        {formatUSD(item.price_usd * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="bg-[#111] border border-[#1a1a1a] rounded-[6px] p-4 space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-[#555]">Subtotal</span>
                  <span className="text-white">
                    {formatUSD((order.total_usd ?? 0) - (order.delivery_fee_usd ?? 0))}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#555]">Delivery</span>
                  <span className="text-white">{formatUSD(order.delivery_fee_usd ?? 0)}</span>
                </div>
                <div className="border-t border-[#1f1f1f] pt-2.5 flex justify-between">
                  <span className="text-white font-semibold text-sm">Total</span>
                  <span className="text-[#C5A021] font-bold text-sm">
                    {formatUSD(order.total_usd ?? 0)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
