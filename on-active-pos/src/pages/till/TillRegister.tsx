import { useState } from 'react';
import { useIncomingOrders } from '../../hooks/useIncomingOrders';
import { IncomingQueue } from '../../components/till/IncomingQueue';
import { WalkInRegister } from '../../components/till/WalkInRegister';
import { VerifyOrder } from '../../components/till/VerifyOrder';
import type { SalesmanOrder } from '../../types/order';

export default function TillRegister() {
  const { orders, acceptOrder, cancelOrder, completeOrder } = useIncomingOrders();
  const [activeTab, setActiveTab] = useState<'incoming' | 'walkin'>('incoming');
  const [selectedOrder, setSelectedOrder] = useState<SalesmanOrder | null>(null);

  const pendingOrders = orders.filter(o => o.status === 'pending');

  const handleAccept = async (order: SalesmanOrder) => {
    await acceptOrder(order.id);
    setSelectedOrder({ ...order, status: 'accepted' });
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
                  onCancel={() => {
                    cancelOrder(selectedOrder.id);
                    setSelectedOrder(null);
                  }}
                  onPay={() => {
                    completeOrder(selectedOrder.id);
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
