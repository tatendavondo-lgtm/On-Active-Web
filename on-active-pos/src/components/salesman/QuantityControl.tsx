import { Minus, Plus } from 'lucide-react';

interface QuantityControlProps {
  quantity: number;
  onChange: (qty: number) => void;
  min?: number;
  max?: number;
}

export function QuantityControl({ quantity, onChange, min = 0, max = 99 }: QuantityControlProps) {
  return (
    <div className="flex items-center bg-[var(--pos-surface-elevated)] border border-[var(--pos-border)] rounded-[var(--pos-radius)] h-9 w-28 select-none">
      <button 
        onClick={() => quantity > min && onChange(quantity - 1)}
        disabled={quantity <= min}
        className="flex-1 flex items-center justify-center h-full text-[var(--pos-text-secondary)] hover:text-white hover:bg-[var(--pos-surface-hover)] disabled:opacity-50 transition-colors"
      >
        <Minus className="w-4 h-4" />
      </button>
      <div className="flex-1 flex items-center justify-center h-full font-mono text-sm font-medium border-x border-[var(--pos-border)]">
        {quantity}
      </div>
      <button 
        onClick={() => quantity < max && onChange(quantity + 1)}
        disabled={quantity >= max}
        className="flex-1 flex items-center justify-center h-full text-[var(--pos-text-secondary)] hover:text-white hover:bg-[var(--pos-surface-hover)] disabled:opacity-50 transition-colors"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
