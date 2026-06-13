export interface FilterState {
  date: 'today' | 'yesterday' | 'week' | 'month' | 'all';
  source: 'all' | 'salesman' | 'walk_in' | 'online';
  status: 'all' | 'pending' | 'completed' | 'cancelled';
}

interface OrderFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  search: string;
  onSearchChange: (val: string) => void;
}

export function OrderFilters({ filters, onChange, search, onSearchChange }: OrderFiltersProps) {
  return (
    <div className="flex flex-col gap-4 bg-[var(--pos-surface)] p-4 border-b border-[var(--pos-border)]">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Orders</h1>
        <input
          type="text"
          placeholder="Search order #, customer..."
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          className="bg-[var(--pos-bg)] border border-[var(--pos-border)] rounded-[var(--pos-radius)] px-4 py-2 text-sm focus:border-[var(--pos-accent)] focus:outline-none w-64"
        />
      </div>
      
      <div className="flex gap-4">
        <select
          value={filters.date}
          onChange={e => onChange({ ...filters, date: e.target.value as any })}
          className="bg-[var(--pos-bg)] border border-[var(--pos-border)] rounded-[var(--pos-radius)] px-3 py-1.5 text-sm focus:outline-none"
        >
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="all">All Time</option>
        </select>

        <select
          value={filters.source}
          onChange={e => onChange({ ...filters, source: e.target.value as any })}
          className="bg-[var(--pos-bg)] border border-[var(--pos-border)] rounded-[var(--pos-radius)] px-3 py-1.5 text-sm focus:outline-none"
        >
          <option value="all">All Sources</option>
          <option value="salesman">Salesman</option>
          <option value="walk_in">Walk-in</option>
          <option value="online">Online</option>
        </select>

        <select
          value={filters.status}
          onChange={e => onChange({ ...filters, status: e.target.value as any })}
          className="bg-[var(--pos-bg)] border border-[var(--pos-border)] rounded-[var(--pos-radius)] px-3 py-1.5 text-sm focus:outline-none"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
    </div>
  );
}
