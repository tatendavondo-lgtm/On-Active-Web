import { useOnlineOrders } from '../../hooks/useOnlineOrders';
import { formatUSD } from '../../lib/currency';
import { Clock, ShoppingBag, Truck, Check } from 'lucide-react';
import { Button } from '../../components/shared/Button';
import { formatDistanceToNow } from 'date-fns';

export default function OnlineOrders() {
  const { grouped, stats, moveToStatus } = useOnlineOrders();

  const columns = [
    { id: 'pending', title: 'Pending', status: 'pending', nextStatus: 'preparing', actionLabel: 'Accept' },
    { id: 'preparing', title: 'Preparing', status: 'preparing', nextStatus: 'ready', actionLabel: 'Ready' },
    { id: 'ready', title: 'Ready', status: 'ready', nextStatus: 'completed', actionLabel: 'Done' },
    { id: 'completed', title: 'Completed', status: 'completed', nextStatus: null, actionLabel: null },
  ];

  return (
    <div className="flex flex-col h-full bg-[var(--pos-bg)]">
      <div className="flex justify-between items-center p-6 border-b border-[var(--pos-border)] bg-[var(--pos-surface)]">
        <h1 className="text-2xl font-bold">Online Orders</h1>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 bg-[var(--pos-bg)] px-3 py-1.5 rounded-full border border-[var(--pos-border)]">
            <span className="w-2 h-2 rounded-full bg-[var(--pos-success)] animate-pulse" />
            <span className="text-xs font-medium text-[var(--pos-text-secondary)]">Auto-refresh: ON</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto p-6 flex gap-6 min-h-0">
        {columns.map((col) => (
          <div key={col.id} className="flex-shrink-0 w-80 flex flex-col h-full bg-[var(--pos-surface)]/30 rounded-[var(--pos-radius-lg)] border border-[var(--pos-border)]/50">
            <div className="p-4 border-b border-[var(--pos-border)]/50 flex justify-between items-center bg-[var(--pos-surface)]/50 rounded-t-[var(--pos-radius-lg)]">
              <h3 className="font-bold uppercase tracking-wider text-xs text-[var(--pos-text-secondary)]">{col.title}</h3>
              <span className="bg-[var(--pos-bg)] text-[var(--pos-text-secondary)] px-2 py-0.5 rounded text-xs font-mono border border-[var(--pos-border)]">
                {col.id === 'completed' ? stats.completedToday : (grouped as any)[col.id].length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {(grouped as any)[col.id].length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center text-[var(--pos-text-muted)] text-sm italic opacity-50">
                  No orders
                </div>
              ) : (
                (grouped as any)[col.id].map((order: any) => (
                  <OrderCard 
                    key={order.id} 
                    order={order} 
                    onAdvance={col.nextStatus ? () => moveToStatus(order.id, col.nextStatus!) : undefined}
                    actionLabel={col.actionLabel}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrderCard({ order, onAdvance, actionLabel }: { order: any, onAdvance?: () => void, actionLabel: string | null }) {
  const isDelivery = order.fulfillment === 'delivery';
  
  return (
    <div className={`bg-[var(--pos-surface-elevated)] border-l-4 rounded-r-[var(--pos-radius)] p-4 shadow-sm border-y border-r border-y-[var(--pos-border-subtle)] border-r-[var(--pos-border-subtle)] transition-all hover:translate-y-[-2px] hover:shadow-md ${isDelivery ? 'border-l-pink-500' : 'border-l-amber-500'}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className="text-xs font-mono font-bold text-white block mb-1">#{order.order_number.split('-').pop()}</span>
          <div className="flex items-center gap-1.5">
            {isDelivery ? <Truck className="w-3 h-3 text-pink-400" /> : <ShoppingBag className="w-3 h-3 text-amber-400" />}
            <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--pos-text-muted)]">{order.fulfillment}</span>
          </div>
        </div>
        <span className="text-[10px] text-[var(--pos-text-muted)] flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--pos-text-secondary)]">{order.items?.length || 0} items</span>
          <span className="font-mono font-bold text-white">{formatUSD(order.total)}</span>
        </div>
        {order.customer_name && (
          <div className="text-xs text-[var(--pos-text-secondary)] font-medium">
            Customer: {order.customer_name}
          </div>
        )}
      </div>

      {onAdvance && actionLabel && (
        <Button 
          variant="primary" 
          size="sm" 
          className="w-full text-xs py-2 h-auto" 
          onClick={onAdvance}
        >
          {actionLabel === 'Accept' ? 'Accept' : actionLabel === 'Ready' ? (isDelivery ? 'Out for Delivery' : 'Ready for Pickup') : 'Complete'}
          <Check className="w-3 h-3 ml-2" />
        </Button>
      )}
    </div>
  );
}
