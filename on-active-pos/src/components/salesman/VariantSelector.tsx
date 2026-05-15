import { useState } from 'react';
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';
import { useCartStore } from '../../stores/cartStore';
import { formatUSD } from '../../lib/currency';
import type { LocalProduct } from '../../db/dexie';

interface VariantSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  product: LocalProduct;
}

export function VariantSelector({ isOpen, onClose, product }: VariantSelectorProps) {
  const addItem = useCartStore(s => s.addItem);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedVariant = product.variants.find(v => v.id === selectedId);

  const handleAdd = () => {
    if (!selectedVariant) return;
    
    addItem({
      product_id: product.id,
      variant_id: selectedVariant.id,
      product_name: product.name,
      variant_name: selectedVariant.name !== 'base' ? selectedVariant.name : undefined,
      sku: selectedVariant.sku || product.sku,
      quantity: 1,
      unit_price: Number(selectedVariant.price) || Number((product as any).price_usd) || 0
    });
    
    onClose();
    setTimeout(() => setSelectedId(null), 200);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product.name}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button 
            variant="primary" 
            onClick={handleAdd} 
            disabled={!selectedId || (selectedVariant?.stock || 0) <= 0}
          >
            Add to Order
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-[var(--pos-text-muted)] text-sm mb-4">Select a variant to add to the order.</p>
        <div className="grid grid-cols-2 gap-3">
          {product.variants.map(v => (
            <button
              key={v.id}
              disabled={v.stock <= 0}
              onClick={() => setSelectedId(v.id)}
              className={`flex flex-col p-4 rounded-[var(--pos-radius)] border text-left transition-all ${
                v.stock <= 0 
                  ? 'opacity-50 border-[var(--pos-border)] cursor-not-allowed bg-[var(--pos-surface)]'
                  : selectedId === v.id
                    ? 'border-[var(--pos-accent)] bg-[var(--pos-accent)]/5 shadow-[0_0_0_1px_var(--pos-accent)]'
                    : 'border-[var(--pos-border)] hover:border-[var(--pos-border-subtle)] bg-[var(--pos-surface)] hover:bg-[var(--pos-surface-hover)]'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium text-white">{v.name}</span>
                {v.stock <= 0 && <span className="text-[10px] uppercase font-bold text-[var(--pos-error)] bg-[var(--pos-error)]/10 px-1.5 py-0.5 rounded">Out</span>}
              </div>
              <div className="flex justify-between items-end mt-auto w-full">
                <span className="font-mono text-[var(--pos-accent)]">{formatUSD(v.price)}</span>
                <span className="text-xs text-[var(--pos-text-muted)]">{v.stock} left</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
