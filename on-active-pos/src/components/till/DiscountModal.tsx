import { useState } from 'react';
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';
import { formatUSD } from '../../lib/currency';
import type { AutoDiscount } from '../../types/cart';

interface DiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtotal: number;
  autoDiscount: AutoDiscount;
  onApply: (amount: number, type: 'percentage' | 'fixed') => void;
}

export function DiscountModal({ isOpen, onClose, subtotal, autoDiscount, onApply }: DiscountModalProps) {
  const [type, setType] = useState<'percentage' | 'fixed'>('percentage');
  const [value, setValue] = useState('');
  const [needsSupervisor, setNeedsSupervisor] = useState(false);
  const [supervisorPin, setSupervisorPin] = useState('');

  const numValue = parseFloat(value) || 0;
  
  // Calculate discount
  const baseAmount = autoDiscount.applied ? autoDiscount.discounted_total : subtotal;
  const discountAmount = type === 'percentage' 
    ? baseAmount * (numValue / 100)
    : numValue;
    
  const finalTotal = Math.max(0, baseAmount - discountAmount);
  
  const handleApply = () => {
    if (type === 'percentage' && numValue > 20 && !needsSupervisor) {
      setNeedsSupervisor(true);
      return;
    }
    
    if (needsSupervisor && supervisorPin !== '9999') { // Hardcoded for demo
      alert('Invalid supervisor PIN');
      return;
    }
    
    onApply(discountAmount, type);
    resetAndClose();
  };
  
  const resetAndClose = () => {
    setValue('');
    setNeedsSupervisor(false);
    setSupervisorPin('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={resetAndClose} title="Manual Discount">
      <div className="space-y-6">
        {needsSupervisor ? (
          <div className="space-y-4">
            <div className="bg-[var(--pos-error)]/10 text-[var(--pos-error)] p-4 rounded-[var(--pos-radius)] text-center font-medium border border-[var(--pos-error)]/20">
              Discounts over 20% require Supervisor Authorization
            </div>
            <div>
              <label className="block text-sm text-[var(--pos-text-secondary)] mb-2">Enter Supervisor PIN</label>
              <input
                type="password"
                value={supervisorPin}
                onChange={e => setSupervisorPin(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApply();
                  }
                }}
                className="w-full bg-[var(--pos-surface)] border border-[var(--pos-border)] rounded-[var(--pos-radius)] h-12 px-4 text-center text-2xl tracking-widest focus:border-[var(--pos-accent)] focus:outline-none"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => setNeedsSupervisor(false)}>Cancel</Button>
              <Button variant="primary" className="flex-1 bg-[var(--pos-error)] text-white hover:bg-[var(--pos-error)]/90" onClick={handleApply}>Authorize</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex bg-[var(--pos-surface)] p-1 rounded-[var(--pos-radius)]">
              <button
                className={`flex-1 py-2 text-sm font-medium rounded ${type === 'percentage' ? 'bg-[var(--pos-surface-elevated)] text-white shadow' : 'text-[var(--pos-text-muted)]'}`}
                onClick={() => { setType('percentage'); setValue(''); }}
              >
                Percentage (%)
              </button>
              <button
                className={`flex-1 py-2 text-sm font-medium rounded ${type === 'fixed' ? 'bg-[var(--pos-surface-elevated)] text-white shadow' : 'text-[var(--pos-text-muted)]'}`}
                onClick={() => { setType('fixed'); setValue(''); }}
              >
                Fixed Amount ($)
              </button>
            </div>

            <div>
              <input
                type="number"
                value={value}
                onChange={e => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && numValue > 0 && finalTotal >= 0) {
                    e.preventDefault();
                    handleApply();
                  }
                }}
                placeholder={type === 'percentage' ? '0%' : '$0.00'}
                className="w-full bg-[var(--pos-surface)] border border-[var(--pos-border)] rounded-[var(--pos-radius)] h-16 px-4 text-center text-3xl font-mono focus:border-[var(--pos-accent)] focus:outline-none"
                autoFocus
              />
            </div>

            <div className="bg-[var(--pos-surface)] p-4 rounded-[var(--pos-radius)] border border-[var(--pos-border-subtle)] space-y-2 text-sm font-mono">
              <div className="flex justify-between text-[var(--pos-text-secondary)]">
                <span>Subtotal:</span>
                <span>{formatUSD(subtotal)}</span>
              </div>
              {autoDiscount.applied && (
                <div className="flex justify-between text-[#10B981]">
                  <span>Auto discount (2%):</span>
                  <span>-{formatUSD(autoDiscount.amount)}</span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between text-[#10B981]">
                  <span>Manual discount:</span>
                  <span>-{formatUSD(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-[var(--pos-border-subtle)] mt-2">
                <span>Total:</span>
                <span>{formatUSD(finalTotal)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={resetAndClose}>Cancel</Button>
              <Button variant="primary" className="flex-1" onClick={handleApply} disabled={numValue <= 0 || finalTotal < 0}>
                Apply Discount
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
