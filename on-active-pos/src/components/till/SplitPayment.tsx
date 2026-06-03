import { useState } from 'react';
import { Button } from '../shared/Button';
import { formatUSD, formatZIG, formatZAR } from '../../lib/currency';
import { useExchangeRates } from '../../hooks/useExchangeRates';
import type { Payment } from '../../types/order';

interface SplitPaymentProps {
  payments: Payment[];
  onAddPayment: (payment: Payment) => void;
  onRemovePayment: (id: string) => void;
  remainingUsd: number;
}

export function SplitPayment({ payments, onAddPayment, onRemovePayment, remainingUsd }: SplitPaymentProps) {
  const { rates } = useExchangeRates();
  const [currency, setCurrency] = useState<'USD' | 'ZIG' | 'ZAR'>('USD');
  const [method, setMethod] = useState<'cash' | 'ecocash' | 'innbucks' | 'card'>('cash');
  const [amountInput, setAmountInput] = useState('');

  const rate = currency === 'USD' ? 1 : rates[currency];
  const remainingInCurrency = remainingUsd * rate;

  const handleAdd = () => {
    const amt = parseFloat(amountInput);
    if (!amt || amt <= 0) return;
    
    // Convert back to USD for canonical storage and round to exactly 2 decimal places
    let amountUsd = currency === 'USD' ? amt : (amt / rate);
    amountUsd = Math.round(amountUsd * 100) / 100;
    
    // Don't overcharge
    const finalAmountUsd = Math.min(amountUsd, remainingUsd);
    
    onAddPayment({
      id: crypto.randomUUID(),
      method,
      amount_usd: finalAmountUsd,
      status: 'completed',
      local_currency: currency !== 'USD' ? currency : undefined,
      amount_local: currency !== 'USD' ? finalAmountUsd * rate : undefined,
      exchange_rate_used: currency !== 'USD' ? rate : undefined,
      tendered: currency === 'USD' ? amt : undefined,
      change_given: currency === 'USD' && method === 'cash' ? Math.max(0, amt - remainingUsd) : undefined
    });
    
    setAmountInput('');
  };

  const getFormat = (cur: string) => {
    if (cur === 'ZIG') return formatZIG;
    if (cur === 'ZAR') return formatZAR;
    return formatUSD;
  };

  return (
    <div className="space-y-4">
      {/* Existing payments */}
      {payments.length > 0 && (
        <div className="bg-[var(--pos-surface)] p-3 rounded-[var(--pos-radius)] border border-[var(--pos-border-subtle)]">
          <h4 className="text-xs font-semibold text-[var(--pos-text-secondary)] uppercase mb-2">Payments Received</h4>
          <div className="space-y-2">
            {payments.map(p => (
              <div key={p.id} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <button onClick={() => onRemovePayment(p.id)} className="text-[var(--pos-error)] hover:bg-[var(--pos-error)]/10 px-2 py-0.5 rounded">✕</button>
                  <span className="capitalize">{p.method}</span>
                </div>
                <div className="font-mono">
                  {p.local_currency ? (
                    <>
                      <span className="text-[var(--pos-text-muted)] mr-2">({getFormat(p.local_currency)(p.amount_local || 0)})</span>
                      {formatUSD(p.amount_usd)}
                    </>
                  ) : (
                    formatUSD(p.amount_usd)
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {remainingUsd > 0 && (
        <div className="bg-[var(--pos-surface)] p-4 rounded-[var(--pos-radius)] border border-[var(--pos-border)] space-y-4">
          <div className="flex gap-2 p-1 bg-[var(--pos-bg)] rounded-[var(--pos-radius)]">
            {['USD', 'ZIG', 'ZAR'].map(c => (
              <button
                key={c}
                className={`flex-1 py-1.5 text-sm font-medium rounded ${currency === c ? 'bg-[var(--pos-surface-elevated)] text-white shadow' : 'text-[var(--pos-text-muted)] hover:text-white'}`}
                onClick={() => setCurrency(c as any)}
              >
                {c}
              </button>
            ))}
          </div>
          
          <div className="flex gap-2">
            {['cash', 'ecocash', 'innbucks', 'card'].map(m => {
              if ((m === 'ecocash' || m === 'innbucks') && currency !== 'USD') return null;
              return (
                <button
                  key={m}
                  className={`flex-1 py-1.5 text-xs font-medium rounded capitalize border ${method === m ? 'bg-[var(--pos-accent)]/10 border-[var(--pos-accent)] text-[var(--pos-accent)]' : 'bg-[var(--pos-bg)] border-[var(--pos-border)] text-[var(--pos-text-muted)] hover:border-[var(--pos-border-subtle)] hover:text-white'}`}
                  onClick={() => setMethod(m as any)}
                >
                  {m}
                </button>
              );
            })}
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-[var(--pos-text-secondary)]">Amount to pay</span>
              <span className="font-mono">{getFormat(currency)(remainingInCurrency)}</span>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                value={amountInput}
                onChange={e => setAmountInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAdd();
                  }
                }}
                placeholder="0.00"
                className="flex-1 bg-[var(--pos-bg)] border border-[var(--pos-border)] rounded-[var(--pos-radius)] px-3 font-mono focus:border-[var(--pos-accent)] focus:outline-none"
              />
              <Button variant="secondary" onClick={() => setAmountInput(remainingInCurrency.toFixed(2))}>Exact</Button>
            </div>
          </div>

          <Button variant="primary" className="w-full" onClick={handleAdd} disabled={!parseFloat(amountInput) || parseFloat(amountInput) <= 0}>
            Add Payment
          </Button>
        </div>
      )}
    </div>
  );
}
