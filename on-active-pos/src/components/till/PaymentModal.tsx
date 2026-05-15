import { useState } from 'react';
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';
import { AutoDiscountBanner } from './AutoDiscountBanner';
import { SplitPayment } from './SplitPayment';
import { formatUSD, formatZIG, formatZAR } from '../../lib/currency';
import { useExchangeRates } from '../../hooks/useExchangeRates';
import type { AutoDiscount } from '../../types/cart';
import type { Payment } from '../../types/order';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  autoDiscount: AutoDiscount;
  onComplete: (payments: Payment[]) => void;
}

export function PaymentModal({ isOpen, onClose, total, autoDiscount, onComplete }: PaymentModalProps) {
  const { rates } = useExchangeRates();
  const [payments, setPayments] = useState<Payment[]>([]);

  const totalPaidUsd = payments.reduce((sum, p) => sum + p.amount_usd, 0);
  const remainingUsd = Math.max(0, total - totalPaidUsd);
  const isComplete = remainingUsd === 0;

  const handleAddPayment = (p: Payment) => {
    setPayments(prev => [...prev, p]);
  };

  const handleRemovePayment = (id: string) => {
    setPayments(prev => prev.filter(p => p.id !== id));
  };

  const handleComplete = () => {
    if (isComplete) {
      onComplete(payments);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Complete Sale">
      <div className="space-y-6">
        {autoDiscount.applied && (
          <AutoDiscountBanner autoDiscount={autoDiscount} />
        )}

        <div className="bg-[var(--pos-surface)] p-6 rounded-[var(--pos-radius-lg)] border border-[var(--pos-border)] text-center space-y-4">
          <div className="text-[var(--pos-text-secondary)] text-sm uppercase font-semibold tracking-wider">Total Due</div>
          <div className="text-4xl font-bold font-mono text-white">
            {formatUSD(total)}
          </div>
          <div className="flex justify-center gap-6 text-sm font-mono text-[var(--pos-text-muted)] border-t border-[var(--pos-border-subtle)] pt-4 mt-4">
            <span>{formatZIG(total * rates.ZIG)}</span>
            <span className="w-px h-4 bg-[var(--pos-border)]" />
            <span>{formatZAR(total * rates.ZAR)}</span>
          </div>
        </div>

        <SplitPayment 
          payments={payments}
          onAddPayment={handleAddPayment}
          onRemovePayment={handleRemovePayment}
          remainingUsd={remainingUsd}
        />

        <div className="flex justify-between items-center bg-[var(--pos-surface-elevated)] p-4 rounded-[var(--pos-radius)] border border-[var(--pos-border)]">
          <span className="text-[var(--pos-text-secondary)]">Remaining Balance</span>
          <span className="font-mono text-xl font-bold text-white">{formatUSD(remainingUsd)}</span>
        </div>

        <div className="flex gap-4">
          <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button 
            variant="primary" 
            className={`flex-1 ${isComplete ? 'bg-[var(--pos-success)] text-white hover:bg-[var(--pos-success)]/90 shadow-lg shadow-[var(--pos-success)]/20' : ''}`}
            onClick={handleComplete} 
            disabled={!isComplete}
          >
            Complete Sale
          </Button>
        </div>
      </div>
    </Modal>
  );
}
