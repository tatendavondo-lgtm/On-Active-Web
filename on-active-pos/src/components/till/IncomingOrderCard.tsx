import { Clock, User } from 'lucide-react';
import { formatUSD } from '../../lib/currency';
import { Button } from '../shared/Button';
import type { SalesmanOrder } from '../../types/order';

interface IncomingOrderCardProps {
  order: SalesmanOrder;
  onAccept: () => void;
}

export function IncomingOrderCard({ order, onAccept }: IncomingOrderCardProps) {
  const time = new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="bg-[var(--pos-surface-elevated)] border-l-4 border-l-[var(--pos-salesman)] border border-[var(--pos-border)] rounded-[var(--pos-radius-lg)] p-4 flex flex-col gap-4 shadow-sm">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2 text-[var(--pos-salesman)] font-medium text-sm">
          <User className="w-4 h-4" />
          {order.salesman_name}
        </div>
        <div className="flex items-center gap-1 text-[var(--pos-text-muted)] text-xs">
          <Clock className="w-3 h-3" />
          {time}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-lg text-white truncate">
          {order.customer_name || 'Walk-in Customer'}
        </h3>
        <p className="text-sm text-[var(--pos-text-secondary)] mt-1">
          {order.item_count} items • {formatUSD(order.subtotal)}
        </p>
      </div>

      <Button variant="primary" onClick={onAccept} className="w-full mt-2 bg-white text-black hover:bg-gray-200">
        Accept Order
      </Button>
    </div>
  );
}
