import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/dexie';
import { useSessionStore } from '../../stores/sessionStore';
import { formatUSD } from '../../lib/currency';
import { Badge } from '../../components/shared/Badge';

export default function MyOrders() {
  const { employee, store } = useSessionStore();

  const orders = useLiveQuery(
    () => db.salesmanOrders
      .where('salesman_id')
      .equals(employee?.id || '')
      .filter(o => o.store_id === store?.id)
      .reverse()
      .sortBy('created_at'),
    [employee?.id, store?.id]
  );

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending': return <Badge variant="warning">Pending Till</Badge>;
      case 'accepted': return <Badge variant="info">At Till</Badge>;
      case 'completed': return <Badge variant="success">Completed</Badge>;
      case 'cancelled': return <Badge variant="error">Cancelled</Badge>;
      default: return <Badge variant="info">{status}</Badge>;
    }
  };

  const handleCancel = async (id: string) => {
    if (confirm('Are you sure you want to cancel this pending order?')) {
      await db.salesmanOrders.update(id, { status: 'cancelled' });
      await db.syncQueue.add({
        table: 'salesman_orders',
        operation: 'update',
        data: { id, status: 'cancelled' },
        created_at: new Date().toISOString(),
        attempts: 0
      });
    }
  };

  return (
    <div className="h-full flex flex-col p-8 overflow-hidden max-w-5xl mx-auto w-full">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Sent Orders</h1>
          <p className="text-[var(--pos-text-secondary)]">Orders you've sent to the till today</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
        {(!orders || orders.length === 0) ? (
          <div className="h-64 flex flex-col items-center justify-center text-[var(--pos-text-muted)] bg-[var(--pos-surface-elevated)] rounded-[var(--pos-radius-lg)] border border-[var(--pos-border)]">
            <span className="text-4xl mb-4 opacity-50">📋</span>
            <p>You haven't sent any orders yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => (
              <div key={order.id} className="bg-[var(--pos-surface-elevated)] border border-[var(--pos-border)] rounded-[var(--pos-radius-lg)] p-6 hover:border-[var(--pos-border-subtle)] transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-lg font-semibold">{order.customer_name || 'Walk-in Customer'}</span>
                      {getStatusBadge(order.status)}
                    </div>
                    <span className="text-sm text-[var(--pos-text-muted)]">
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {order.item_count} items
                    </span>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="font-mono text-xl text-[var(--pos-accent)] font-medium">
                      {formatUSD(order.subtotal)}
                    </span>
                    {order.status === 'pending' && (
                      <button 
                        onClick={() => handleCancel(order.id)}
                        className="text-sm text-[var(--pos-error)] mt-2 hover:underline"
                      >
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-[var(--pos-surface)] rounded-[var(--pos-radius)] p-4 border border-[var(--pos-border-subtle)]">
                  <div className="space-y-2">
                    {(order.items || []).map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <div className="flex gap-2">
                          <span className="text-[var(--pos-text-secondary)]">{item.quantity}x</span>
                          <span>{item.product_name} {item.variant_name && <span className="text-[var(--pos-text-muted)] text-xs ml-1">({item.variant_name})</span>}</span>
                        </div>
                        <span className="font-mono text-[var(--pos-text-secondary)]">{formatUSD(item.line_total)}</span>
                      </div>
                    ))}
                  </div>
                  {order.notes && (
                    <div className="mt-4 pt-4 border-t border-[var(--pos-border-subtle)] text-sm">
                      <span className="text-[var(--pos-text-muted)] mr-2">Notes:</span>
                      <span className="italic text-[var(--pos-text-secondary)]">{order.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
