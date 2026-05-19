'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertTriangle, Box } from 'lucide-react';
import type { InventoryItem } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { getStockoutUrgency, formatUSD } from '@/lib/admin/utils';
import { EmptyState } from '../ui/EmptyState';
import toast from 'react-hot-toast';

interface InventoryTableProps {
  inventory: InventoryItem[];
}

function StockoutBadge({ days }: { days: number | null }) {
  const urgency = getStockoutUrgency(days);
  const config = {
    safe: { text: days !== null ? `~${days}d left` : 'Stable', cls: 'text-[#C5A021] bg-[#C5A021]/10' },
    warning: { text: `~${days}d left`, cls: 'text-amber-400 bg-amber-500/10' },
    critical: { text: `~${days}d left`, cls: 'text-red-400 bg-red-500/10 font-bold' },
  }[urgency];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[11px] font-semibold ${config.cls}`}>
      {urgency === 'critical' && <AlertTriangle size={10} />}
      {config.text}
    </span>
  );
}

export function InventoryTable({ inventory }: InventoryTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('inventory-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => { router.refresh(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [router]);

  const saveStock = async (productId: string) => {
    const qty = parseInt(editValue);
    if (isNaN(qty) || qty < 0) { toast.error('Invalid quantity'); return; }
    const supabase = createClient();
    const { error } = await supabase
      .from('products')
      .update({ stock_quantity: qty, updated_at: new Date().toISOString() })
      .eq('id', productId);
    if (error) toast.error('Failed to update');
    else { toast.success('Stock updated'); setEditingId(null); }
  };

  if (inventory.length === 0) {
    return <EmptyState icon={Box} title="No products found" description="Add products to track inventory." />;
  }

  const stockColor = (qty: number) =>
    qty === 0 ? 'text-red-400' : qty <= 5 ? 'text-amber-400' : 'text-[#C5A021]';

  return (
    <div className="bg-[#111] border border-[#1f1f1f] rounded-[8px] overflow-hidden">
      <div className="px-6 py-4 border-b border-[#1a1a1a]">
        <h2 className="text-white font-bold text-sm">Inventory</h2>
        <p className="text-[#444] text-xs mt-0.5">Click a stock number to edit it inline</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#181818]">
              {['Product', 'Category', 'Price', 'Stock', '7d Sales', '30d Sales', 'Stockout', 'Restock Suggestion'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[#444] text-[11px] font-bold uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {inventory.map((item, i) => (
              <motion.tr
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02, duration: 0.2 }}
                className="border-b border-[#141414] hover:bg-[#161616] transition-colors"
              >
                <td className="px-4 py-3.5">
                  <p className="text-white text-sm font-medium">{item.name}</p>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-[#555] text-sm">{item.category ?? '—'}</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-white text-sm">{formatUSD(item.price_usd)}</span>
                </td>
                <td className="px-4 py-3.5">
                  {editingId === item.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveStock(item.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        autoFocus
                        className="w-16 bg-[#0a0a0a] border border-[#C5A021]/40 rounded-[4px] px-2 py-1 text-white text-sm font-mono outline-none"
                      />
                      <button onClick={() => saveStock(item.id)} className="text-[#C5A021] text-xs hover:underline">Save</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingId(item.id); setEditValue(String(item.stock_quantity)); }}
                      className={`font-bold text-sm font-mono hover:underline decoration-dotted ${stockColor(item.stock_quantity)}`}
                      title="Click to edit"
                    >
                      {item.stock_quantity}
                    </button>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-[#555] text-sm">{item.salesLast7Days}</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-[#666] text-sm">{item.salesLast30Days}</span>
                </td>
                <td className="px-4 py-3.5">
                  <StockoutBadge days={item.daysUntilStockout} />
                </td>
                <td className="px-4 py-3.5">
                  {item.suggestedRestock > 0 ? (
                    <span className="inline-flex items-center px-2 py-0.5 bg-[#1a1a1a] border border-[#2a2a2a] text-[#888] text-[11px] rounded-[4px]">
                      Order ~{item.suggestedRestock} units
                    </span>
                  ) : (
                    <span className="text-[#333] text-xs">—</span>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
