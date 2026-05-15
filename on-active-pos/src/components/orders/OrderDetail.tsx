import { formatUSD, formatZIG, formatZAR } from '../../lib/currency';
import { OrderStatusBadge } from './OrderStatusBadge';
import { Button } from '../shared/Button';
import type { Order } from '../../types/order';

interface OrderDetailProps {
  order: Order;
  salesmanName?: string;
  employeeName?: string;
}

export function OrderDetail({ order, salesmanName, employeeName }: OrderDetailProps) {
  const getFormat = (cur: string) => {
    if (cur === 'ZIG') return formatZIG;
    if (cur === 'ZAR') return formatZAR;
    return formatUSD;
  };

  return (
    <div className="flex flex-col h-full bg-[var(--pos-surface-elevated)] border-l border-[var(--pos-border)] overflow-hidden">
      <div className="p-6 border-b border-[var(--pos-border)] flex-shrink-0 bg-[var(--pos-surface)] flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold font-mono tracking-tight">{order.order_number}</h2>
          <div className="flex items-center gap-3 mt-2 text-sm text-[var(--pos-text-secondary)]">
            <OrderStatusBadge status={order.status} />
            <span>•</span>
            <span>{new Date(order.created_at).toLocaleString()}</span>
          </div>
        </div>
        <Button variant="secondary" onClick={() => alert('Print receipt will be in Prompt 3')}>
          Print Receipt
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-8">
        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <span className="text-[var(--pos-text-muted)] block">Source</span>
            <span className="font-medium capitalize">{order.source.replace('_', ' ')}</span>
            {order.source === 'salesman' && <span className="text-[var(--pos-text-secondary)] ml-2">({salesmanName || 'Unknown'})</span>}
          </div>
          <div className="space-y-1">
            <span className="text-[var(--pos-text-muted)] block">Processed By</span>
            <span className="font-medium">{employeeName || 'Unknown Till'}</span>
          </div>
        </div>

        {/* Items */}
        <div>
          <h3 className="font-semibold mb-3">Items</h3>
          <div className="border border-[var(--pos-border)] rounded-[var(--pos-radius)] overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-[var(--pos-surface)] border-b border-[var(--pos-border-subtle)] text-[var(--pos-text-secondary)]">
                <tr>
                  <th className="px-4 py-2 font-medium">Item</th>
                  <th className="px-4 py-2 font-medium text-center">Qty</th>
                  <th className="px-4 py-2 font-medium text-right">Price</th>
                  <th className="px-4 py-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--pos-border-subtle)]">
                {order.items.map(item => (
                  <tr key={item.id} className="bg-[var(--pos-bg)]">
                    <td className="px-4 py-3">
                      <div>{item.product_name}</div>
                      {item.variant_name && <div className="text-xs text-[var(--pos-text-muted)]">{item.variant_name}</div>}
                    </td>
                    <td className="px-4 py-3 text-center">{item.quantity}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatUSD(item.unit_price)}</td>
                    <td className="px-4 py-3 text-right font-mono text-[var(--pos-text-secondary)]">{formatUSD(item.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between text-[var(--pos-text-secondary)]">
              <span>Subtotal</span>
              <span className="font-mono">{formatUSD(order.subtotal)}</span>
            </div>
            {order.auto_discount_applied && (
              <div className="flex justify-between text-[#10B981]">
                <span>Auto discount</span>
                <span className="font-mono">-{formatUSD(order.auto_discount_amount || 0)}</span>
              </div>
            )}
            {(order.manual_discount_amount || 0) > 0 && (
              <div className="flex justify-between text-[#10B981]">
                <span>Manual discount</span>
                <span className="font-mono">-{formatUSD(order.manual_discount_amount || 0)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-lg font-bold pt-2 border-t border-[var(--pos-border-subtle)]">
              <span>Total</span>
              <span className="font-mono text-[var(--pos-success)]">{formatUSD(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Payments */}
        <div>
          <h3 className="font-semibold mb-3">Payments</h3>
          <div className="space-y-2">
            {order.payments.map(p => (
              <div key={p.id} className="flex justify-between items-center bg-[var(--pos-surface)] p-3 rounded-[var(--pos-radius)] border border-[var(--pos-border)] text-sm">
                <div className="capitalize">{p.method} <span className="text-[var(--pos-text-muted)] ml-2">({p.local_currency || 'USD'})</span></div>
                <div className="text-right font-mono">
                  {p.local_currency ? (
                    <>
                      <span>{getFormat(p.local_currency)(p.amount_local || 0)}</span>
                      <span className="text-[var(--pos-text-muted)] text-xs ml-2">(≈ {formatUSD(p.amount_usd)} @ {p.exchange_rate_used})</span>
                    </>
                  ) : (
                    <span>{formatUSD(p.amount_usd)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Exchange Rates Snapshot */}
        {order.exchange_rate_zig && (
          <div className="bg-[var(--pos-bg)] border border-[var(--pos-border)] p-3 rounded-[var(--pos-radius)] text-xs text-[var(--pos-text-muted)] font-mono flex justify-between">
            <span>Exchange rates at time of sale:</span>
            <span>1 USD = {order.exchange_rate_zig} ZIG | 1 USD = {order.exchange_rate_zar} ZAR</span>
          </div>
        )}
      </div>
    </div>
  );
}
