import type { TopProduct } from '@/types';
import { Package } from 'lucide-react';

interface TopProductsProps {
  products: TopProduct[];
}

export function TopProducts({ products }: TopProductsProps) {
  const max = Math.max(...products.map((p) => p.orderCount), 1);

  return (
    <div className="bg-[#111] border border-[#1f1f1f] rounded-[8px] p-6">
      <h2 className="text-white font-bold text-sm mb-1">Top Products</h2>
      <p className="text-[#444] text-xs mb-5">By orders this month</p>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8">
          <Package size={24} className="text-[#2a2a2a] mb-2" />
          <p className="text-[#444] text-xs">No data yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((product, i) => {
            const barWidth = Math.round((product.orderCount / max) * 100);
            const stockColor =
              product.stock === 0
                ? 'bg-red-500'
                : product.stock <= 5
                ? 'bg-amber-400'
                : 'bg-[#C5A021]';
            const stockPct = Math.min(Math.round((product.stock / 50) * 100), 100);

            return (
              <div key={product.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[#333] text-xs font-bold w-4 flex-shrink-0">
                      #{i + 1}
                    </span>
                    <p className="text-white text-xs font-medium truncate">{product.name}</p>
                  </div>
                  <span className="text-[#555] text-[11px] ml-2 flex-shrink-0">
                    {product.orderCount} orders
                  </span>
                </div>
                {/* Order bar */}
                <div className="h-1.5 bg-[#1a1a1a] rounded-full mb-1.5 overflow-hidden">
                  <div
                    className="h-full bg-[#C5A021] rounded-full transition-all duration-700"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                {/* Stock bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 bg-[#161616] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${stockColor}`}
                      style={{ width: `${stockPct}%`, opacity: 0.6 }}
                    />
                  </div>
                  <span className="text-[#444] text-[10px] flex-shrink-0">
                    {product.stock} in stock
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
