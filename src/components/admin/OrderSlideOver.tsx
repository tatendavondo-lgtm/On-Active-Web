'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, CreditCard, Banknote, Store, User, Loader2 } from 'lucide-react';
import { StatusBadge } from './ui/StatusBadge';
import { formatUSD, formatDate } from '@/lib/admin/utils';
import { UnifiedOrder } from './orders/OrdersTable';

interface OrderSlideOverProps {
  order: any | null;
  onClose: () => void;
}

export function OrderSlideOver({ order, onClose }: OrderSlideOverProps) {
  const source = order?.source ?? 'webstore';
  const [posItems, setPosItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    if (order && source.startsWith('pos') && (!order.items || order.items.length === 0)) {
      setLoadingItems(true);
      fetch(`/api/admin/orders/pos-items?orderId=${order.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.items) {
            setPosItems(data.items.map((i: any) => ({
              id: i.product_id,
              name: i.product_name,
              quantity: i.quantity,
              price: i.price_usd
            })));
          }
        })
        .catch(err => console.error("Failed to load POS items:", err))
        .finally(() => setLoadingItems(false));
    } else {
      setPosItems([]);
    }
  }, [order, source]);

  const displayItems = source.startsWith('pos') ? (posItems.length > 0 ? posItems : order?.items) : order?.items;

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
                <div className="flex items-center gap-2">
                  <h2 className="text-white font-bold text-base">{order.order_ref}</h2>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-[3px] bg-[#1a1a1a] text-[#888]">
                    {source.replace('pos_', '')}
                  </span>
                </div>
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
              
              {/* POS Specific Data */}
              {source.startsWith('pos') && order.pos_data && (
                <div className="bg-[#111] border border-[#1a1a1a] rounded-[6px] p-4 space-y-3">
                  <p className="text-[#666] text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                    <Store size={12} /> Point of Sale Details
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-[#555] text-xs mb-1">Till Operator</p>
                      <p className="text-white flex items-center gap-1.5">
                        <User size={13} className="text-[#888]" />
                        {order.pos_data.till_operator || 'Unknown'}
                      </p>
                    </div>
                    {source === 'pos_salesman' && (
                      <div>
                        <p className="text-[#555] text-xs mb-1">Salesman</p>
                        <p className="text-white flex items-center gap-1.5">
                          <User size={13} className="text-[#a855f7]" />
                          {order.pos_data.salesman || 'Unknown'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#1f1f1f]">
                    <p className="text-[#555] text-xs mb-2">Payment Breakdown</p>
                    <div className="flex items-center justify-between text-sm bg-[#0a0a0a] p-2 rounded border border-[#1a1a1a]">
                      <div className="flex items-center gap-2">
                        {order.pos_data.payment_method === 'cash' ? (
                          <Banknote size={14} className="text-green-500" />
                        ) : (
                          <CreditCard size={14} className="text-blue-500" />
                        )}
                        <span className="text-white capitalize">{order.pos_data.payment_method}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-mono">{order.pos_data.currency} {order.pos_data.amount_paid}</p>
                        {order.pos_data.currency !== 'USD' && (
                          <p className="text-[#555] text-[10px]">Rate: {order.pos_data.exchange_rate}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {order.pos_data.auto_discount_applied && (
                    <div className="mt-2 text-xs text-[#C5A021] bg-[#C5A021]/10 px-2 py-1.5 rounded">
                      Auto-discount applied: -{formatUSD(order.pos_data.auto_discount_amount || 0)}
                    </div>
                  )}
                </div>
              )}

              {/* Items */}
              <div>
                <p className="text-[#444] text-[11px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                  Items ({displayItems?.length ?? 0})
                  {loadingItems && <Loader2 size={12} className="animate-spin text-[#888]" />}
                </p>
                {(!displayItems || displayItems.length === 0) && !loadingItems ? (
                  <p className="text-[#555] text-sm italic">No items found for this order.</p>
                ) : (
                  <div className="space-y-2">
                    {displayItems?.map((item: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-[#111] border border-[#1a1a1a] rounded-[6px]">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-11 h-11 object-cover rounded-[4px] flex-shrink-0 bg-[#1a1a1a]" />
                        ) : (
                          <div className="w-11 h-11 bg-[#1a1a1a] rounded-[4px] flex items-center justify-center flex-shrink-0">
                            <Package size={14} className="text-[#333]" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{item.name}</p>
                          <p className="text-[#444] text-xs">Size {item.size} · Qty {item.quantity}</p>
                        </div>
                        <p className="text-white text-sm font-semibold flex-shrink-0">
                          {formatUSD((item.price_usd || item.price || 0) * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="bg-[#111] border border-[#1a1a1a] rounded-[6px] p-4 space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-[#555]">Subtotal</span>
                  <span className="text-white">
                    {formatUSD(order.total_usd - (order.delivery_fee_usd ?? 0))}
                  </span>
                </div>
                {order.delivery_fee_usd !== undefined && order.delivery_fee_usd > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#555]">Delivery</span>
                    <span className="text-white">{formatUSD(order.delivery_fee_usd)}</span>
                  </div>
                )}
                <div className="border-t border-[#1f1f1f] pt-2.5 flex justify-between">
                  <span className="text-white font-semibold text-sm">Total USD</span>
                  <span className="text-[#C5A021] font-bold text-sm">
                    {formatUSD(order.total_usd)}
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
