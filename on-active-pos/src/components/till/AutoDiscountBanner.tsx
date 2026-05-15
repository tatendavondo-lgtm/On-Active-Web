import { Tag } from 'lucide-react';
import { formatUSD } from '../../lib/currency';
import type { AutoDiscount } from '../../types/cart';

interface AutoDiscountBannerProps {
  autoDiscount: AutoDiscount;
}

export function AutoDiscountBanner({ autoDiscount }: AutoDiscountBannerProps) {
  if (!autoDiscount.applied) return null;

  return (
    <div className="bg-[#10B981]/10 border border-[#10B981]/30 rounded-[var(--pos-radius)] p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-[#10B981] font-bold">
        <Tag className="w-5 h-5 fill-current" />
        <span>{autoDiscount.percentage}% DISCOUNT APPLIED!</span>
      </div>
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mt-1">
        <span className="text-[var(--pos-text-secondary)]">Original:</span>
        <span className="text-right line-through opacity-70">{formatUSD(autoDiscount.original_total)}</span>
        
        <span className="text-[var(--pos-text-secondary)]">Discount:</span>
        <span className="text-right text-[#10B981] font-medium">-{formatUSD(autoDiscount.amount)}</span>
        
        <span className="text-white font-medium mt-1 pt-1 border-t border-[#10B981]/20">You pay:</span>
        <span className="text-right text-white font-bold mt-1 pt-1 border-t border-[#10B981]/20">{formatUSD(autoDiscount.discounted_total)}</span>
      </div>

      <p className="text-[#10B981] text-xs italic mt-2 text-center">
        "You qualify for our {autoDiscount.percentage}% discount!"
      </p>
    </div>
  );
}
