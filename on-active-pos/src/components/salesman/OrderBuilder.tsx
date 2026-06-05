import { useState } from 'react';
import { Trash2, Send } from 'lucide-react';
import { useCartStore } from '../../stores/cartStore';
import { QuantityControl } from './QuantityControl';
import { formatUSD } from '../../lib/currency';
import { SendToTillModal } from './SendToTillModal';

export function OrderBuilder() {
  const { items, subtotal, removeItem, updateQuantity, clearCart } = useCartStore();
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [showSendModal, setShowSendModal] = useState(false);

  return (
    <>
      <div className="flex flex-col h-full bg-zinc-900 border-l border-zinc-800 relative shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
        <div className="p-4 border-b border-zinc-800 bg-zinc-950 flex-shrink-0">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white mb-3">Current Order</h2>
          <input
            type="text"
            placeholder="Customer Name (optional)"
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            className="w-full h-10 px-4 bg-zinc-900 border border-zinc-800 rounded-[var(--pos-radius-lg)] text-xs font-bold tracking-widest uppercase placeholder-white/30 text-white focus:border-[var(--pos-accent)] focus:outline-none transition-colors shadow-inner"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[var(--pos-text-muted)] gap-4">
              <div className="w-16 h-16 rounded-full bg-[var(--pos-surface)] flex items-center justify-center border border-[var(--pos-border)]">
                <span className="text-2xl">🛍️</span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Order is empty</p>
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
                        <span className="font-black text-xs uppercase tracking-wide text-white leading-tight line-clamp-1">{item.product_name}</span>
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
          <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider text-[var(--pos-text-secondary)]">
            <span>Subtotal</span>
            <span className="font-mono text-white">{formatUSD(subtotal)}</span>
          </div>

          <textarea
            placeholder="Add notes for till (optional)..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full h-16 p-3 text-[10px] font-black uppercase tracking-widest bg-black/40 border border-white/10 rounded-[var(--pos-radius-lg)] resize-none placeholder-white/30 text-white focus:border-[var(--pos-accent)] focus:outline-none transition-colors custom-scrollbar shadow-inner"
          />

          <div className="grid grid-cols-3 gap-3">
            <button 
              onClick={clearCart} 
              disabled={items.length === 0}
              className="col-span-1 p-0 text-[10px] font-black uppercase tracking-widest border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 hover:border-[var(--pos-error)] hover:text-[var(--pos-error)] transition-colors h-11 rounded-[var(--pos-radius)] disabled:opacity-50"
            >
              Clear
            </button>
            <button 
              onClick={() => setShowSendModal(true)} 
              disabled={items.length === 0}
              className="col-span-2 text-xs font-black uppercase tracking-widest bg-[var(--pos-accent)] text-black shadow-[0_0_25px_rgba(197,160,33,0.2)] hover:bg-[var(--pos-accent-light)] transition-all h-11 flex items-center justify-center rounded-[var(--pos-radius)] disabled:opacity-50 disabled:shadow-none"
            >
              Send to Till <Send className="w-4 h-4 ml-2" />
            </button>
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
