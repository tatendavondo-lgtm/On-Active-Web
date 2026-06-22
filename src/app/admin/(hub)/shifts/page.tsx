import { createAdminClient } from '@/lib/supabase/admin';
import { formatUSD } from '@/lib/currency';
import { Badge } from '@/components/ui/badge';
import { ShiftsDataTable } from './ShiftsDataTable';

export const dynamic = 'force-dynamic';

export default async function ShiftsPage() {
  const adminSupabase = createAdminClient();

  const { data: shifts } = await adminSupabase
    .from('shifts')
    .select('id, expected_cash, closing_cash, cash_difference, opened_at, closed_at, status, employees(full_name), stores(name)')
    .order('closed_at', { ascending: false });

  // Map the data for the client component
  const mappedShifts = (shifts || []).map((s) => ({
    id: s.id,
    operatorName: s.employees?.full_name || 'Unknown',
    storeName: s.stores?.name || 'Unknown',
    expectedCash: s.expected_cash || 0,
    actualCash: s.closing_cash || 0,
    variance: s.cash_difference || 0,
    openedAt: s.opened_at,
    closedAt: s.closed_at,
    status: s.status,
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Shift Reports</h1>
        <p className="text-muted-foreground mt-1">Review historical cash reconciliations from all till operators.</p>
      </div>

      <ShiftsDataTable data={mappedShifts} />
    </div>
  );
}
