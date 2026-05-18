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
        className="group relative flex flex-col bg-[#111111] border border-white/5 rounded-[var(--pos-radius-lg)] overflow-hidden hover:border-[var(--pos-accent)] hover:shadow-[0_0_20px_rgba(197,160,33,0.12)] transition-all duration-300 text-left"
      >
        <div className="aspect-square bg-[#1a1a1a] w-full overflow-hidden relative">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--pos-text-muted)] text-3xl font-black italic opacity-10 tracking-tighter">
              ON ACTIVE.
            </div>
          )}
          {totalStock <= 0 && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-[2px]">
              <span className="bg-[var(--pos-error)] text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded">OUT OF STOCK</span>
            </div>
          )}
        </div>
        <div className="p-4 w-full flex flex-col gap-2 mt-auto">
          <span className="font-black text-xs uppercase tracking-wider text-white line-clamp-1 leading-tight">{product.name}</span>
          <div className="flex items-center justify-between mt-1 pt-2 border-t border-white/5">
            <span className="font-mono font-black text-xs text-[var(--pos-accent)]">{formatUSD(basePrice)}</span>
            <span className={`text-[9px] font-black uppercase tracking-wider ${totalStock <= 0 ? 'text-[var(--pos-error)]' : 'text-[var(--pos-text-muted)]'}`}>
              {Math.max(0, totalStock)} on hand
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
