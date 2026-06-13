import { useState, useEffect, useRef } from 'react';
import { useIncomingOrders } from '../../hooks/useIncomingOrders';
import { IncomingQueue } from '../../components/till/IncomingQueue';
import { WalkInRegister } from '../../components/till/WalkInRegister';
import { VerifyOrder } from '../../components/till/VerifyOrder';
import type { SalesmanOrder } from '../../types/order';
import { db } from '../../db/dexie';
import toast from 'react-hot-toast';
import { useCartStore } from '../../stores/cartStore';
import { useNotificationStore } from '../../stores/notificationStore';

export default function TillRegister() {
  const { orders, acceptOrder, cancelOrder, completeOrder } = useIncomingOrders();
  const [activeTab, setActiveTab] = useState<'incoming' | 'walkin'>('incoming');
  const [selectedOrder, setSelectedOrder] = useState<SalesmanOrder | null>(null);
  const clearIncomingOrders = useNotificationStore(s => s.clearIncomingOrders);

  // Track whether we're currently restoring to avoid blocking accept
  const restoringRef = useRef(false);

  // Restore any active accepted order from local DB on mount only (not on every orders update)
  useEffect(() => {
    async function restoreAcceptedOrder() {
      restoringRef.current = true;
      try {
        const accepted = await db.salesmanOrders
          .where('status')
          .equals('accepted')
          .first();
        if (accepted) {
          setSelectedOrder(accepted);
        }
      } catch (err) {
        console.error('Failed to restore accepted order:', err);
      } finally {
        restoringRef.current = false;
      }
    }
    restoreAcceptedOrder();
  }, []); // Mount only — orders list changes shouldn't re-trigger restore

  // Auto-clear incoming order notifications when on the incoming tab
  useEffect(() => {
    if (activeTab === 'incoming') {
      clearIncomingOrders();
    }
  }, [activeTab, clearIncomingOrders]);

  const pendingOrders = orders.filter(o => o.status === 'pending');

  const handleAccept = async (order: SalesmanOrder) => {
    // 1. Refuse if there is an active order in the UI state
    if (selectedOrder) {
      toast.error('You already have an active order in progress. Complete or cancel it first!', {
        id: 'active-order-refuse',
      });
      return;
    }

    // 2. Refuse if there is already an accepted order in IndexedDB
    try {
      const alreadyAccepted = await db.salesmanOrders
        .where('status')
        .equals('accepted')
        .first();
      if (alreadyAccepted) {
        toast.error('You already have an active order in progress. Complete or cancel it first!', {
          id: 'active-order-refuse-db',
        });
        setSelectedOrder(alreadyAccepted);
        return;
      }
    } catch (err) {
      console.warn('Check accepted order DB query failed:', err);
    }

    try {
      // 3. ATOMIC LOCK CHECK: Ensure the order is still 'pending' locally
      // Since useIncomingOrders now writes UPDATE payloads directly to Dexie,
      // if another Till accepted this, the local DB will show it as 'accepted'.
      const currentOrderState = await db.salesmanOrders.get(order.id);
      if (!currentOrderState || currentOrderState.status !== 'pending') {
        toast.error('This order is no longer pending (it may have been claimed by another till or cancelled).');
        return;
      }

      await acceptOrder(order.id);
      setSelectedOrder({ ...order, status: 'accepted' });
    } catch (err: any) {
      console.error('Failed to accept order:', err);
      toast.error('Failed to accept order: ' + (err.message || err));
      // Force loading the order UI locally even if remote sync failed
      setSelectedOrder({ ...order, status: 'accepted' });
    }
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <div className="h-14 bg-[var(--pos-surface-elevated)] border-b border-[var(--pos-border)] flex px-4 gap-8 flex-shrink-0">
        <button
          onClick={() => setActiveTab('incoming')}
          className={`relative h-full px-4 font-medium transition-colors ${
            activeTab === 'incoming' ? 'text-white' : 'text-[var(--pos-text-muted)] hover:text-[var(--pos-text-secondary)]'
          }`}
        >
          Incoming Orders
          {pendingOrders.length > 0 && (
            <span className="ml-2 bg-[var(--pos-salesman)] text-white text-xs px-2 py-0.5 rounded-full font-bold">
              {pendingOrders.length}
            </span>
          )}
          {activeTab === 'incoming' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--pos-accent)]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('walkin')}
          className={`relative h-full px-4 font-medium transition-colors ${
            activeTab === 'walkin' ? 'text-white' : 'text-[var(--pos-text-muted)] hover:text-[var(--pos-text-secondary)]'
          }`}
        >
          Walk-in Sale
          {activeTab === 'walkin' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--pos-accent)]" />
          )}
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'incoming' ? (
          <div className="flex h-full">
            <div className="flex-1 border-r border-[var(--pos-border)] flex flex-col overflow-hidden bg-[var(--pos-bg)]">
              <IncomingQueue 
                orders={pendingOrders} 
                onAccept={handleAccept} 
              />
            </div>
            <div className="w-[var(--pos-cart-width)] bg-[var(--pos-surface)] h-full flex flex-col overflow-hidden">
              {selectedOrder ? (
                <VerifyOrder 
                  order={selectedOrder} 
                  onCancel={async () => {
                    try {
                      await cancelOrder(selectedOrder.id);
                    } catch (err) {
                      console.error('Failed to cancel order:', err);
                      toast.error('Sync queue error, but order cleared locally.');
                    }
                    useCartStore.getState().clearCart();
                    setSelectedOrder(null);
                  }}
                  onPay={async () => {
                    try {
                      await completeOrder(selectedOrder.id);
                    } catch (err) {
                      console.error('Failed to complete order:', err);
                      toast.error('Sync queue error, but order marked complete locally.');
                    }
                    useCartStore.getState().clearCart();
                    setSelectedOrder(null);
                  }}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-[var(--pos-text-muted)] p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-[var(--pos-surface-elevated)] flex items-center justify-center border border-[var(--pos-border)] mb-4">
                    <span className="text-2xl opacity-50">📋</span>
                  </div>
                  <p>Select an incoming order to verify items and process payment.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <WalkInRegister />
        )}
      </div>
    </div>
  );
}
