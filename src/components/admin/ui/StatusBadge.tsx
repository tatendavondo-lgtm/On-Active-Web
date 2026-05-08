import type { OrderStatus } from '@/types';

interface StatusBadgeProps {
  status: OrderStatus;
}

const CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-amber-500/12 text-amber-400 border-amber-500/20' },
  confirmed: { label: 'Confirmed', className: 'bg-[#C5A021]/12 text-[#C5A021] border-[#C5A021]/20' },
  cancelled: { label: 'Cancelled', className: 'bg-red-500/12 text-red-400 border-red-500/20' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const cfg = CONFIG[status] ?? CONFIG.pending;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-[3px] border ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}
