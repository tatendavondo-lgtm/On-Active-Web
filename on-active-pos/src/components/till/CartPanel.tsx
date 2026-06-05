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
import { logPosAction } from '../../lib/audit';
import { transformOrderToReceipt } from '../../lib/receipt';
import { ReceiptPreview } from '../receipt/ReceiptPreview';

export function CartPanel() {
  const { items, subtotal, total, autoDiscount, manualDiscountAmount, manualDiscountType, totalDiscount, taxAmount, applyManualDiscount, removeItem, updateQuantity, clearCart } = useCartStore();
  const { employee, store, shiftId, deviceId } = useSessionStore();
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
    if (!employee || !store || !shiftId) {
      alert('You must have an open shift to process a sale.');
      return;
    }
    
    try {
      const order = await processOrder({
        storeId: store.id,
        employeeId: employee.id,
        shiftId: shiftId,
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
      
      logPosAction({
        userId: employee.id,
        userName: employee.full_name,
        userRole: employee.role,
        action: 'complete_sale',
        targetType: 'order',
        targetId: order.id,
        details: { total: order.total, items: order.items.length },
        storeId: store.id
      });

      setShowPayment(false);
      clearCart();
    } catch (err) {
      console.error('Failed to process order', err);
      alert('Failed to process order.');
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-l border-zinc-800 relative shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
      <div className="p-4 border-b border-zinc-800 bg-zinc-950 flex justify-between items-center flex-shrink-0">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white">Walk-in Order</h2>
        <span className="text-[9px] font-black uppercase tracking-widest bg-[var(--pos-accent)]/10 text-[var(--pos-accent)] py-1 px-2.5 rounded-full border border-[var(--pos-accent)]/20 shadow-[0_0_10px_rgba(197,160,33,0.1)]">
          Live Terminal
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-[var(--pos-text-muted)] gap-4">
            <div className="w-14 h-14 rounded-full bg-[#111] flex items-center justify-center border border-white/5">
              <span className="text-xl opacity-60">🛒</span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Cart is empty</p>
          </div>
        ) : (
          <div className="space-y-3">
                {items.map(item => (
                  <div 
                    key={item.id} 
                    className="flex flex-col gap-3 p-4 bg-zinc-800 rounded-[var(--pos-radius-lg)] border border-zinc-700 hover:border-[var(--pos-accent)]/40 transition-colors shadow-lg"
                  >
                  <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="font-black text-xs uppercase tracking-wide text-white leading-tight">{item.product_name}</span>
                    {item.variant_name && <span className="text-[10px] font-black uppercase tracking-widest text-[var(--pos-text-muted)] mt-1">{item.variant_name}</span>}
                  </div>
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="text-[var(--pos-text-muted)] hover:text-[var(--pos-error)] transition-colors p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex justify-between items-center mt-1 pt-2 border-t border-white/5">
                  <QuantityControl 
                    quantity={item.quantity} 
                    onChange={(q) => updateQuantity(item.id, q)} 
                    min={1} 
                    max={item.max_stock}
                  />
                  <span className="font-mono text-xs text-[var(--pos-accent)] font-black">
                    {formatUSD(item.line_total)}
                  </span>
                </div>
                  </div>
                ))}
            </div>
          )}
        </div>

      <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex-shrink-0 flex flex-col gap-4 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        {autoDiscount.applied && <AutoDiscountBanner autoDiscount={autoDiscount} />}
        
        <div className="space-y-2.5 text-xs font-black uppercase tracking-wider text-[var(--pos-text-secondary)]">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-mono text-white">{formatUSD(subtotal)}</span>
          </div>
          {manualDiscountAmount > 0 && (
            <div className="flex justify-between text-[#10B981]">
              <span>Manual Discount</span>
              <span className="font-mono">-{formatUSD(manualDiscountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-white/5 mt-2">
            <span>Tax (0%)</span>
            <span className="font-mono text-white">$0.00</span>
          </div>
          <div className="flex justify-between items-center text-sm font-black text-white pt-3 border-t-2 border-[var(--pos-accent)]/30 mt-3">
            <span>Total</span>
            <span className="font-mono text-2xl text-[var(--pos-accent)]">{formatUSD(total)}</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mt-2">
          <button 
            onClick={clearCart} 
            disabled={items.length === 0} 
            className="col-span-1 p-0 text-[10px] font-black uppercase tracking-widest border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 hover:border-[var(--pos-error)] hover:text-[var(--pos-error)] transition-colors h-11 rounded-[var(--pos-radius)] disabled:opacity-50"
          >
            Clear
          </button>
          <button 
            onClick={() => setShowDiscount(true)} 
            disabled={items.length === 0} 
            className="col-span-1 px-0 text-[10px] font-black uppercase tracking-widest border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 hover:border-[var(--pos-accent)] hover:text-white transition-colors h-11 rounded-[var(--pos-radius)] disabled:opacity-50"
          >
            Disc
          </button>
          <button 
            onClick={() => setShowPayment(true)} 
            disabled={items.length === 0} 
            className="col-span-2 text-xs font-black uppercase tracking-widest bg-[var(--pos-accent)] text-black shadow-[0_0_25px_rgba(197,160,33,0.2)] hover:bg-[var(--pos-accent-light)] transition-all h-11 cursor-pointer flex items-center justify-center rounded-[var(--pos-radius)] disabled:opacity-50 disabled:shadow-none"
          >
            Pay
          </button>
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
