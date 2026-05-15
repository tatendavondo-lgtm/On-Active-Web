import { useState } from 'react';
import { Trash2, Send } from 'lucide-react';
import { useCartStore } from '../../stores/cartStore';
import { QuantityControl } from './QuantityControl';
import { formatUSD } from '../../lib/currency';
import { Button } from '../shared/Button';
import { SendToTillModal } from './SendToTillModal';

export function OrderBuilder() {
  const { items, subtotal, removeItem, updateQuantity, clearCart } = useCartStore();
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [showSendModal, setShowSendModal] = useState(false);

  return (
    <>
      <div className="flex flex-col h-full bg-[var(--pos-surface-elevated)] border-l border-[var(--pos-border)] relative">
        <div className="p-4 border-b border-[var(--pos-border)] flex-shrink-0">
          <h2 className="text-lg font-semibold mb-3">Current Order</h2>
          <input
            type="text"
            placeholder="Customer Name (optional)"
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            className="w-full h-10 px-3 bg-[var(--pos-surface)] border border-[var(--pos-border)] rounded-[var(--pos-radius)] text-sm placeholder-[var(--pos-text-muted)] focus:border-[var(--pos-accent)] focus:outline-none transition-colors"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[var(--pos-text-muted)] gap-4">
              <div className="w-16 h-16 rounded-full bg-[var(--pos-surface)] flex items-center justify-center border border-[var(--pos-border)]">
                <span className="text-2xl">🛍️</span>
              </div>
              <p>Order is empty</p>
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
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Subtotal</span>
            <span className="font-mono">{formatUSD(subtotal)}</span>
          </div>

          <textarea
            placeholder="Add notes for till (optional)..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full h-16 p-3 text-sm bg-[var(--pos-bg)] border border-[var(--pos-border)] rounded-[var(--pos-radius)] resize-none placeholder-[var(--pos-text-muted)] focus:border-[var(--pos-accent)] focus:outline-none transition-colors custom-scrollbar"
          />

          <div className="grid grid-cols-3 gap-3">
            <Button 
              variant="secondary" 
              onClick={clearCart} 
              disabled={items.length === 0}
              className="col-span-1"
            >
              Clear
            </Button>
            <Button 
              variant="primary" 
              onClick={() => setShowSendModal(true)} 
              disabled={items.length === 0}
              className="col-span-2 text-lg font-bold shadow-lg shadow-[var(--pos-accent)]/10"
            >
              Send to Till <Send className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      <SendToTillModal 
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        customerName={customerName}
        setCustomerName={setCustomerName}
        notes={notes}
        setNotes={setNotes}
        onSent={() => {
          setCustomerName('');
          setNotes('');
        }}
      />
    </>
  );
}
