import { useState, useMemo } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Button } from '../shared/Button';
import { formatUSD } from '../../lib/currency';
import type { Order } from '../../types/order';
import { processRefund } from '../../lib/orderProcessing';

import { useSessionStore } from '../../stores/sessionStore';

interface RefundModalProps {
  order: Order;
  onClose: () => void;
  onRefundComplete: () => void;
}

export function RefundModal({ order, onClose, onRefundComplete }: RefundModalProps) {
  const { shiftId } = useSessionStore();
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});
  const [method, setMethod] = useState<'cash' | 'ecocash' | 'innbucks' | 'card'>('cash');
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Available items for refund (ones that haven't been fully refunded yet)
  const items = order.items.filter(i => i.quantity - (i.refunded_quantity || 0) > 0);

  const handleQtyChange = (itemId: string, qty: number, max: number, refunded: number) => {
    const available = max - refunded;
    const validQty = Math.max(0, Math.min(qty, available));
    setReturnQuantities(prev => ({
      ...prev,
      [itemId]: validQty
    }));
  };

  const refundTotal = useMemo(() => {
    let total = 0;
    for (const item of items) {
      const qty = returnQuantities[item.id] || 0;
      // Calculate unit price after any discounts applied to that line
      const effectiveUnitPrice = item.line_total / item.quantity;
      total += effectiveUnitPrice * qty;
    }
    return total;
  }, [items, returnQuantities]);

  const isValid = refundTotal > 0 && reason.trim().length > 0;

  const handleRefund = async () => {
    if (!isValid || !shiftId) return;
    setIsProcessing(true);
    try {
      const refundItems = items
        .filter(i => (returnQuantities[i.id] || 0) > 0)
        .map(i => ({
          item: i,
          returnQuantity: returnQuantities[i.id]!
        }));

      await processRefund({
        order,
        refundItems,
        refundMethod: method,
        reason,
        refundTotalUsd: refundTotal,
        shiftId
      });

      onRefundComplete();
    } catch (err) {
      console.error('Failed to process refund:', err);
      alert('Failed to process refund. See console.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--pos-surface-elevated)] border border-[var(--pos-border)] rounded-[var(--pos-radius-lg)] shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-[var(--pos-border)] flex justify-between items-center bg-[var(--pos-surface)]">
          <h2 className="text-lg font-bold">Process Refund / Return</h2>
          <button onClick={onClose} className="p-2 hover:bg-[var(--pos-surface-hover)] rounded-full text-[var(--pos-text-muted)] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-[var(--pos-radius)] text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>Processing a refund will automatically return the selected items back to physical stock and record a negative cash movement.</p>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-sm text-[var(--pos-text-secondary)] uppercase tracking-wider">Select Items to Return</h3>
            <div className="border border-[var(--pos-border-subtle)] rounded-[var(--pos-radius)] overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[var(--pos-surface)] border-b border-[var(--pos-border-subtle)]">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Item</th>
                    <th className="px-4 py-2 text-right font-medium">Available</th>
                    <th className="px-4 py-2 text-right font-medium">Return Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--pos-border-subtle)]">
                  {items.map(item => (
                    <tr key={item.id} className="bg-[var(--pos-bg)]">
                      <td className="px-4 py-3">
                        <div className="font-medium">{item.product_name}</div>
                        {item.variant_name && <div className="text-xs text-[var(--pos-text-muted)]">{item.variant_name}</div>}
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--pos-text-muted)]">
                        {item.quantity - (item.refunded_quantity || 0)} / {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input 
                          type="number" 
                          min="0" 
                          max={item.quantity - (item.refunded_quantity || 0)}
                          value={returnQuantities[item.id] || ''}
                          onChange={(e) => handleQtyChange(item.id, parseInt(e.target.value) || 0, item.quantity, item.refunded_quantity || 0)}
                          placeholder="0"
                          className="w-16 bg-[var(--pos-surface)] border border-[var(--pos-border)] rounded px-2 py-1 text-right text-white focus:outline-none focus:border-[var(--pos-accent)]"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-[var(--pos-text-secondary)]">Refund Method</label>
              <div className="grid grid-cols-2 gap-2">
                {['cash', 'card', 'ecocash', 'innbucks'].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMethod(m as any)}
                    className={`py-2 px-3 border rounded text-sm font-medium capitalize transition-colors ${
                      method === m 
                        ? 'bg-[var(--pos-accent)] border-[var(--pos-accent)] text-white' 
                        : 'bg-[var(--pos-surface)] border-[var(--pos-border)] text-[var(--pos-text-muted)] hover:border-[var(--pos-border-subtle)]'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-[var(--pos-text-secondary)]">Reason for Return</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Defective, Wrong size..."
                className="w-full bg-[var(--pos-surface)] border border-[var(--pos-border)] rounded-[var(--pos-radius)] p-3 text-sm text-white focus:outline-none focus:border-[var(--pos-accent)] resize-none h-24"
              />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--pos-border)] bg-[var(--pos-surface)] flex justify-between items-center">
          <div className="text-[var(--pos-text-muted)]">
            Refund Total: <span className="text-xl font-bold font-mono text-red-400 ml-2">{formatUSD(refundTotal)}</span>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose} disabled={isProcessing}>Cancel</Button>
            <Button variant="primary" onClick={handleRefund} disabled={!isValid || isProcessing} className="bg-red-500 hover:bg-red-600 text-white border-red-600">
              {isProcessing ? 'Processing...' : 'Process Refund'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
