import type { SalesmanOrder } from '../../types/order';
import { IncomingOrderCard } from './IncomingOrderCard';

interface IncomingQueueProps {
  orders: SalesmanOrder[];
  onAccept: (order: SalesmanOrder) => void;
}

export function IncomingQueue({ orders, onAccept }: IncomingQueueProps) {
  if (orders.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-[var(--pos-text-muted)]">
        <p className="text-lg">No incoming orders right now.</p>
        <p className="text-sm mt-2">Orders sent by salesmen will appear here.</p>
      </div>
    );
  }

  return (
    <div className="p-6 overflow-y-auto custom-scrollbar">
      <h2 className="text-xl font-bold mb-6 text-white">Incoming from Sales Floor</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.map(order => (
          <IncomingOrderCard 
            key={order.id} 
            order={order} 
            onAccept={() => onAccept(order)} 
          />
        ))}
      </div>
    </div>
  );
}
