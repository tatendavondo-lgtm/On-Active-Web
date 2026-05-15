import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { useCartStore } from '../../stores/cartStore';
import { QuantityControl } from '../salesman/QuantityControl';
import { AutoDiscountBanner } from './AutoDiscountBanner';
import { PaymentModal } from './PaymentModal';
import { DiscountModal } from './DiscountModal';
import { formatUSD } from '../../lib/currency';
import { useSessionStore } from '../../stores/sessionStore';
import { useExchangeRates } from '../../hooks/useExchangeRates';
import { processOrder } from '../../lib/orderProcessing';
import { transformOrderToReceipt } from '../../lib/receipt';
import { ReceiptPreview } from '../receipt/ReceiptPreview';
import { Button } from '../shared/Button';

export function CartPanel() {
  const { items, subtotal, total, autoDiscount, manualDiscountAmount, manualDiscountType, totalDiscount, taxAmount, applyManualDiscount, removeItem, updateQuantity, clearCart } = useCartStore();
  const { employee, store, deviceId } = useSessionStore();
  const { rates } = useExchangeRates();
  const [showPayment, setShowPayment] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [completedReceipt, setCompletedReceipt] = useState<any>(null);

  useEffect(() => {
    const handleTriggerPayment = () => {
      if (items.length > 0 && !showPayment && !completedReceipt) {
        setShowPayment(true);
      }
    };
    window.addEventListener('pos-trigger-payment', handleTriggerPayment);
    return () => window.removeEventListener('pos-trigger-payment', handleTriggerPayment);
  }, [items.length, showPayment, completedReceipt]);

  const handleCompleteSale = async (payments: any[]) => {
    if (!employee || !store) return;
    
    try {
      const order = await processOrder({
        storeId: store.id,
        employeeId: employee.id,
        deviceId: deviceId || 'unknown',
        source: 'walk_in',
        items,
        payments,
        subtotal,
        autoDiscount,
        manualDiscountAmount,
        manualDiscountType: manualDiscountType || null,
        totalDiscount,
        taxAmount,
        total,
        exchangeRateZig: rates.ZIG,
        exchangeRateZar: rates.ZAR,
      });

      const receiptData = transformOrderToReceipt(order as any, store, employee.full_name);
      setCompletedReceipt(receiptData);
      
      setShowPayment(false);
      clearCart();
    } catch (err) {
      console.error('Failed to process order', err);
      alert('Failed to process order.');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--pos-surface-elevated)] border-l border-[var(--pos-border)] relative">
      <div className="p-4 border-b border-[var(--pos-border)] flex-shrink-0">
        <h2 className="text-lg font-semibold">Walk-in Order</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-[var(--pos-text-muted)] gap-4">
            <div className="w-16 h-16 rounded-full bg-[var(--pos-surface)] flex items-center justify-center border border-[var(--pos-border)]">
              <span className="text-2xl">🛒</span>
            </div>
            <p>Cart is empty</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map(item => (
              <div key={item.id} className="flex flex-col gap-2 p-3 bg-[var(--pos-surface)] rounded-[var(--pos-radius)] border border-[var(--pos-border)]">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="font-medium text-sm text-white line-clamp-1">{item.product_name}</span>
                    {item.variant_name && <span className="text-xs text-[var(--pos-text-muted)]">{item.variant_name}</span>}
                  </div>
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="text-[var(--pos-text-muted)] hover:text-[var(--pos-error)] transition-colors p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <QuantityControl 
                    quantity={item.quantity} 
                    onChange={(q) => updateQuantity(item.id, q)} 
                    min={1} 
                  />
                  <span className="font-mono text-[var(--pos-accent)] font-medium">
                    {formatUSD(item.line_total)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-[var(--pos-border)] bg-[var(--pos-surface)] flex-shrink-0 flex flex-col gap-4">
        {autoDiscount.applied && <AutoDiscountBanner autoDiscount={autoDiscount} />}
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-[var(--pos-text-secondary)]">
            <span>Subtotal</span>
            <span className="font-mono">{formatUSD(subtotal)}</span>
          </div>
          {manualDiscountAmount > 0 && (
            <div className="flex justify-between text-[#10B981]">
              <span>Manual Discount</span>
              <span className="font-mono">-{formatUSD(manualDiscountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-[var(--pos-text-secondary)] pt-2 border-t border-[var(--pos-border-subtle)] mt-2">
            <span>Tax (0%)</span>
            <span className="font-mono">$0.00</span>
          </div>
          <div className="flex justify-between items-center text-xl font-bold text-white pt-2">
            <span>Total</span>
            <span className="font-mono">{formatUSD(total)}</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mt-2">
          <Button variant="ghost" onClick={clearCart} disabled={items.length === 0} className="col-span-1 p-0 text-sm">
            Clear
          </Button>
          <Button variant="secondary" onClick={() => setShowDiscount(true)} disabled={items.length === 0} className="col-span-1 px-0 text-sm">
            Discount
          </Button>
          <Button variant="primary" onClick={() => setShowPayment(true)} disabled={items.length === 0} className="col-span-2">
            Pay
          </Button>
        </div>
      </div>

      <PaymentModal 
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        total={total}
        autoDiscount={autoDiscount}
        onComplete={handleCompleteSale}
      />
      
      <DiscountModal
        isOpen={showDiscount}
        onClose={() => setShowDiscount(false)}
        subtotal={subtotal}
        autoDiscount={autoDiscount}
        onApply={(amount, type) => applyManualDiscount(type, amount)}
      />

      {completedReceipt && (
        <div className="fixed inset-0 z-[100] bg-[var(--pos-bg)]/95 flex items-center justify-center overflow-y-auto p-4 custom-scrollbar">
          <ReceiptPreview 
            data={completedReceipt} 
            onNewSale={() => setCompletedReceipt(null)} 
          />
        </div>
      )}
    </div>
  );
}
