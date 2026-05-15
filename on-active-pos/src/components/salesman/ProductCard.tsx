import { useState } from 'react';
import { useCartStore } from '../../stores/cartStore';
import { VariantSelector } from './VariantSelector';
import { formatUSD } from '../../lib/currency';
import type { LocalProduct } from '../../db/dexie';

interface ProductCardProps {
  product: LocalProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const [showVariants, setShowVariants] = useState(false);
  const addItem = useCartStore(s => s.addItem);

  const basePrice = product.variants[0]?.price || 0;
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);

  const handleClick = () => {
    if (product.variants.length > 1) {
      setShowVariants(true);
    } else if (product.variants.length === 1) {
      const v = product.variants[0];
      addItem({
        product_id: product.id,
        variant_id: v.id,
        product_name: product.name,
        variant_name: v.name !== 'base' ? v.name : undefined,
        sku: v.sku || product.sku,
        quantity: 1,
        unit_price: Number(v.price) || Number((product as any).price_usd) || 0
      });
    }
  };

  return (
    <>
      <button 
        onClick={handleClick}
        className="group relative flex flex-col bg-[var(--pos-surface-elevated)] border border-[var(--pos-border)] rounded-[var(--pos-radius-lg)] overflow-hidden hover:border-[var(--pos-accent)] transition-all text-left"
      >
        <div className="aspect-square bg-[var(--pos-surface)] w-full overflow-hidden relative">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--pos-text-muted)] text-4xl font-bold opacity-20">
              OA
            </div>
          )}
          {totalStock <= 0 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
              <span className="bg-[var(--pos-error)] text-white text-xs font-bold px-2 py-1 rounded">OUT OF STOCK</span>
            </div>
          )}
        </div>
        <div className="p-3 w-full flex flex-col gap-1">
          <span className="font-semibold text-sm line-clamp-1">{product.name}</span>
          <div className="flex items-center justify-between mt-auto">
            <span className="font-mono font-medium text-[var(--pos-accent)]">{formatUSD(basePrice)}</span>
            <span className={`text-xs ${totalStock <= 0 ? 'text-[var(--pos-error)]' : 'text-[var(--pos-text-muted)]'}`}>
              {Math.max(0, totalStock)} in stock
            </span>
          </div>
        </div>
      </button>

      <VariantSelector 
        isOpen={showVariants} 
        onClose={() => setShowVariants(false)} 
        product={product} 
      />
    </>
  );
}
