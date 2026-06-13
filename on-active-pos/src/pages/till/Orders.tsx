import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/dexie';
import { OrderFilters, type FilterState } from '../../components/orders/OrderFilters';
import { OrderDetail } from '../../components/orders/OrderDetail';
import { OrderStatusBadge } from '../../components/orders/OrderStatusBadge';
import { formatUSD } from '../../lib/currency';
import type { Order } from '../../types/order';
import { useSessionStore } from '../../stores/sessionStore';

export default function Orders() {
  const { store } = useSessionStore();
  const [filters, setFilters] = useState<FilterState>({ date: 'today', source: 'all', status: 'all' });
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const rawOrders = useLiveQuery(
    () => db.orders
      .where('store_id')
      .equals(store?.id || '')
      .reverse()
      .sortBy('created_at'),
    [store?.id]
  );

  const orders = useMemo(() => {
    if (!rawOrders) return [];
    
    return rawOrders.filter((o: any) => {
      // Status
      if (filters.status !== 'all' && o.status !== filters.status) return false;
      // Source
      if (filters.source !== 'all' && o.source !== filters.source) return false;
      // Search
      if (search) {
        const s = search.toLowerCase();
        if (!o.order_number.toLowerCase().includes(s) && !o.id.toLowerCase().includes(s)) return false;
      }
      
      // Date
      if (filters.date !== 'all') {
        const date = new Date(o.created_at);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (filters.date === 'today' && date.toDateString() !== today.toDateString()) return false;
        if (filters.date === 'yesterday' && date.toDateString() !== yesterday.toDateString()) return false;
        if (filters.date === 'week') {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          if (date < weekAgo) return false;
        }
        if (filters.date === 'month') {
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          if (date < monthAgo) return false;
        }
      }
      
      return true;
    });
  }, [rawOrders, filters, search]);

  const selectedOrder = useMemo(() => orders.find((o: any) => o.id === selectedId) as Order | undefined, [orders, selectedId]);

  const getSourceColor = (source: string) => {
    switch(source) {
      case 'salesman': return 'border-l-[#8B5CF6]'; // purple
      case 'walk_in': return 'border-l-[#6366F1]'; // indigo
      case 'online': return 'border-l-[#F59E0B]'; // amber
      default: return 'border-l-gray-500';
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[var(--pos-bg)]">
      <OrderFilters 
        filters={filters} 
        onChange={setFilters} 
        search={search} 
        onSearchChange={setSearch} 
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="w-[450px] border-r border-[var(--pos-border)] flex flex-col overflow-y-auto custom-scrollbar p-4 space-y-3">
          {orders.length === 0 ? (
            <div className="h-full flex items-center justify-center text-[var(--pos-text-muted)]">
              No orders found.
            </div>
          ) : (
            orders.map((o: any) => (
              <button
                key={o.id}
                onClick={() => setSelectedId(o.id)}
                className={`text-left p-4 rounded-[var(--pos-radius-lg)] border-l-4 border-y border-r transition-all ${
                  selectedId === o.id 
                    ? `bg-[var(--pos-surface-elevated)] border-y-[var(--pos-border-subtle)] border-r-[var(--pos-border-subtle)] ${getSourceColor(o.source)} shadow-md` 
                    : `bg-[var(--pos-surface)] border-y-[var(--pos-border)] border-r-[var(--pos-border)] ${getSourceColor(o.source)} hover:bg-[var(--pos-surface-hover)]`
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono font-bold text-white">{o.order_number}</span>
                  <OrderStatusBadge status={o.status} />
                </div>
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <span className="text-xs text-[var(--pos-text-muted)] capitalize block">{o.source.replace('_', ' ')} • {o.items.length} items</span>
                    <span className="text-sm font-medium text-[var(--pos-text-secondary)]">{formatUSD(o.total)}</span>
                  </div>
                  <span className="text-xs text-[var(--pos-text-muted)]">
                    {new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="flex-1 bg-[var(--pos-bg)]">
          {selectedOrder ? (
            <OrderDetail order={selectedOrder} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-[var(--pos-text-muted)]">
              <span className="text-4xl mb-4 opacity-50">🧾</span>
              <p>Select an order to view details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
