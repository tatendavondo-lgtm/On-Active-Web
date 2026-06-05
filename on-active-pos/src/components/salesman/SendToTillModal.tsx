import { useState } from 'react';
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';
import { useCartStore } from '../../stores/cartStore';
import { useSessionStore } from '../../stores/sessionStore';
import { db } from '../../db/dexie';
import { formatUSD } from '../../lib/currency';

import { generateUUID } from '../../lib/uuid';

interface SendToTillModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  setCustomerName: (name: string) => void;
  notes: string;
  setNotes: (notes: string) => void;
  onSent: () => void;
}

export function SendToTillModal({ isOpen, onClose, customerName, setCustomerName, notes, setNotes, onSent }: SendToTillModalProps) {
  const { items, subtotal, clearCart } = useCartStore();
  const { employee, store, deviceId } = useSessionStore();
  const [sending, setSending] = useState(false);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const handleSend = async () => {
    if (!employee || !store) return;
    setSending(true);
    
    try {
      const orderId = generateUUID();
      const now = new Date().toISOString();

      const orderData = {
        id: orderId,
        store_id: store.id,
        salesman_id: employee.id,
        salesman_name: employee.full_name,
        customer_name: customerName || undefined,
        items: [...items],
        subtotal,
        item_count: itemCount,
        notes: notes || undefined,
        status: 'pending' as const,
        created_at: now,
        synced: false,
        device_id: deviceId
      };

      // 1. Save locally
      await db.salesmanOrders.add(orderData);

      // 2. Add to sync queue for Supabase
      await db.syncQueue.add({
        table: 'salesman_orders',
        operation: 'insert',
        data: orderData,
        created_at: now,
        attempts: 0
      });

      clearCart();
      onSent();
      onClose();
    } catch (err) {
      console.error('Failed to send order:', err);
      alert('Failed to send order. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={!sending ? onClose : undefined}
      title="Send Order to Till"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={sending}>Cancel</Button>
          <Button variant="primary" onClick={handleSend} disabled={sending}>
            {sending ? 'Sending...' : 'Confirm & Send'}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="bg-[var(--pos-surface)] p-4 rounded-[var(--pos-radius)] border border-[var(--pos-border)]">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[var(--pos-text-secondary)]">Items</span>
            <span className="font-semibold text-lg">{itemCount}</span>
          </div>
          <div className="flex justify-between items-center border-t border-[var(--pos-border-subtle)] pt-2 mt-2">
            <span className="text-[var(--pos-text-secondary)]">Subtotal</span>
            <span className="font-mono text-[var(--pos-accent)] text-xl font-medium">{formatUSD(subtotal)}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--pos-text-secondary)] mb-1">Customer Name</label>
            <input
              type="text"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder="e.g. Sarah N."
              className="w-full h-12 px-4 bg-[var(--pos-surface)] border border-[var(--pos-border)] rounded-[var(--pos-radius)] text-white placeholder-[var(--pos-text-muted)] focus:border-[var(--pos-accent)] focus:outline-none transition-colors"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[var(--pos-text-secondary)] mb-1">Notes for Till Operator</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Needs a gift receipt"
              className="w-full p-4 bg-[var(--pos-surface)] border border-[var(--pos-border)] rounded-[var(--pos-radius)] text-white placeholder-[var(--pos-text-muted)] focus:border-[var(--pos-accent)] focus:outline-none transition-colors h-24 resize-none"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
