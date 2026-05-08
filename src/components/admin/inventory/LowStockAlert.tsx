import { AlertTriangle, Zap } from 'lucide-react';
import type { InventoryItem } from '@/types';

interface LowStockAlertProps {
  items: InventoryItem[];
}

export function LowStockAlert({ items }: LowStockAlertProps) {
  const sorted = [...items].sort((a, b) => a.stock_quantity - b.stock_quantity);

  return (
    <div className="bg-amber-500/5 border border-amber-500/20 rounded-[8px] p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-7 h-7 bg-amber-500/15 rounded-[5px] flex items-center justify-center">
          <Zap size={13} className="text-amber-400" />
        </div>
        <div>
          <p className="text-amber-400 text-sm font-bold">
            {items.length} Low Stock {items.length === 1 ? 'Alert' : 'Alerts'}
          </p>
          <p className="text-[#555] text-xs">Products with 5 or fewer units remaining</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {sorted.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-2 px-3 py-2 bg-[#111] border border-amber-500/15 rounded-[6px]"
          >
            <AlertTriangle size={11} className={item.stock_quantity === 0 ? 'text-red-400' : 'text-amber-400'} />
            <span className="text-white text-xs font-medium">{item.name}</span>
            <span
              className={`text-xs font-bold font-mono ${
                item.stock_quantity === 0 ? 'text-red-400' : 'text-amber-400'
              }`}
            >
              {item.stock_quantity === 0 ? 'OUT' : `${item.stock_quantity} left`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
