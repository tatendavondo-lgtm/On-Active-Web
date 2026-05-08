'use client';

import { useState } from 'react';
import { OrderFilters } from './OrderFilters';
import { OrdersTable } from './OrdersTable';
import type { OrderStatus } from '@/types';

type StatusFilter = OrderStatus | 'all';

export function OrdersTableWrapper({ userRole }: { userRole: string }) {
  const [status, setStatus] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');

  return (
    <div className="space-y-4">
      <OrderFilters
        status={status}
        search={search}
        onStatusChange={setStatus}
        onSearchChange={setSearch}
      />
      <OrdersTable filters={{ status, search }} userRole={userRole} />
    </div>
  );
}
