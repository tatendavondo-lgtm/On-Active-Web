'use client';

import { Search } from 'lucide-react';
import type { OrderStatus } from '@/types';

type StatusFilter = OrderStatus | 'all';

interface OrderFiltersProps {
  status: StatusFilter;
  search: string;
  onStatusChange: (s: StatusFilter) => void;
  onSearchChange: (s: string) => void;
}

const STATUSES: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function OrderFilters({ status, search, onStatusChange, onSearchChange }: OrderFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Status tabs */}
      <div className="flex items-center gap-1 bg-[#111] border border-[#1f1f1f] rounded-[6px] p-1">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => onStatusChange(s.value)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-[4px] transition-all duration-150 ${
              status === s.value
                ? 'bg-[#1f1f1f] text-white'
                : 'text-[#444] hover:text-[#888]'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative flex-1 sm:max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#333]" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by order ref..."
          className="w-full bg-[#111] border border-[#1f1f1f] rounded-[6px] pl-9 pr-4 py-2 text-white text-sm outline-none focus:border-[#2a2a2a] transition-colors placeholder:text-[#333]"
        />
      </div>
    </div>
  );
}
