import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { ShiftsDataTable } from './ShiftsDataTable';

export const dynamic = 'force-dynamic';

export default async function ShiftsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }

  const adminSupabase = createAdminClient();

  const { data: shifts } = await adminSupabase
    .from('shifts')
    .select('id, expected_cash, closing_cash, cash_difference, opened_at, closed_at, status, employees(full_name), stores(name)')
    .order('closed_at', { ascending: false });

  // Map the data for the client component safely
  const mappedShifts = (shifts || []).map((s: any) => {
    const emp = Array.isArray(s.employees) ? s.employees[0] : s.employees;
    const store = Array.isArray(s.stores) ? s.stores[0] : s.stores;
    return {
      id: s.id,
      operatorName: emp?.full_name || 'Unknown',
      storeName: store?.name || 'Unknown',
      expectedCash: Number(s.expected_cash || 0),
      actualCash: Number(s.closing_cash || 0),
      variance: Number(s.cash_difference || 0),
      openedAt: s.opened_at,
      closedAt: s.closed_at,
      status: s.status,
    };
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Shift Reports</h1>
        <p className="text-[#666] text-sm mt-1">Review historical cash reconciliations from all till operators.</p>
      </div>

      <ShiftsDataTable data={mappedShifts} />
    </div>
  );
}
