import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { CombinedMetricsPanel } from '@/components/admin/dashboard/CombinedMetricsPanel';
import { getCombinedMetrics } from '@/lib/admin/getCombinedMetrics';
import { Briefcase, ShoppingBag, Users, AlertTriangle, Eye, Store } from 'lucide-react';
import Link from 'next/link';
import { formatUSD } from '@/lib/admin/utils';

export const dynamic = 'force-dynamic';

export default async function ManagerDashboardPage() {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'manager') {
    redirect('/admin/dashboard');
  }

  // Get store_id from employee record matching this manager's email
  const { data: employee } = await adminSupabase
    .from('employees')
    .select('store_id, stores(name)')
    .eq('email', user.email)
    .single();

  // Fallback to first store if not linked to avoid crashing
  let storeId = employee?.store_id;
  let storeName = (employee?.stores as any)?.name ?? 'My Assigned Store';

  if (!storeId) {
    const { data: fallbackStore } = await adminSupabase.from('stores').select('id, name').limit(1).single();
    if (fallbackStore) {
      storeId = fallbackStore.id;
      storeName = fallbackStore.name;
    }
  }

  if (!storeId) {
    return (
      <div className="bg-[#111] border border-red-500/20 text-red-400 p-6 rounded-[8px]">
        <h2 className="font-bold mb-1">Configuration Error</h2>
        <p className="text-sm">You are logged in as a Manager, but no stores exist in the database. Please contact the owner.</p>
      </div>
    );
  }

  // Fetch combined metrics filtered by this manager's store
  const combinedMetrics = await getCombinedMetrics(storeId);

  // Fetch specific lists for display
  const [recentPosOrders, lowStockInventory, activeShifts] = await Promise.all([
    // Today's POS Orders for this store
    adminSupabase
      .from('pos_orders')
      .select('id, order_number, source, status, total, created_at')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .limit(5),

    // Low stock inventory for this store
    adminSupabase
      .from('store_inventory')
      .select('id, quantity, product:products(name)')
      .eq('store_id', storeId)
      .lte('quantity', 5)
      .limit(5),

    // Staff on shift today for this store
    adminSupabase
      .from('shifts')
      .select('id, opened_at, employee:employees(full_name, role)')
      .eq('store_id', storeId)
      .eq('status', 'open')
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[#C5A021] text-[10px] font-bold uppercase tracking-widest bg-[#C5A021]/10 px-2 py-0.5 rounded">
            Store Manager Portal
          </span>
          <h2 className="text-white font-bold text-xl tracking-tight mt-1">
            {storeName}
          </h2>
        </div>
      </div>

      {/* Main Combined Metrics Component */}
      <CombinedMetricsPanel metrics={combinedMetrics} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent POS Orders */}
        <div className="lg:col-span-2 bg-[#111] border border-[#1f1f1f] rounded-[8px] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2">
              <ShoppingBag size={14} className="text-[#C5A021]" /> Recent Store Sales
            </h3>
            <Link href="/admin/orders" className="text-[#888] hover:text-white text-xs font-bold uppercase tracking-wider">
              View All
            </Link>
          </div>
          {recentPosOrders.data?.length === 0 ? (
            <div className="py-8 text-center text-[#444] text-xs font-medium uppercase tracking-wider">
              No sales logged today.
            </div>
          ) : (
            <div className="divide-y divide-[#1a1a1a]">
              {recentPosOrders.data?.map(o => (
                <div key={o.id} className="py-3 flex items-center justify-between text-sm">
                  <div>
                    <p className="text-white font-mono font-semibold">{o.order_number}</p>
                    <p className="text-[#555] text-xs capitalize">{o.source.replace('_', ' ')} · {new Date(o.created_at).toLocaleTimeString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold font-mono">{formatUSD(o.total)}</p>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-green-500/10 text-green-400">
                      {o.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-[#111] border border-[#1f1f1f] rounded-[8px] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-500" /> Low Stock Items
            </h3>
            <span className="text-amber-500 bg-amber-500/10 text-[10px] font-bold px-2 py-0.5 rounded">
              {combinedMetrics.lowStockCount} Alert(s)
            </span>
          </div>
          {lowStockInventory.data?.length === 0 ? (
            <div className="py-8 text-center text-[#444] text-xs font-medium uppercase tracking-wider">
              All inventory fully stocked!
            </div>
          ) : (
            <div className="divide-y divide-[#1a1a1a]">
              {lowStockInventory.data?.map(i => (
                <div key={i.id} className="py-3 flex items-center justify-between text-sm">
                  <span className="text-[#aaa] truncate max-w-[180px]">{(i.product as any)?.name}</span>
                  <span className="text-amber-500 font-mono font-bold">{i.quantity} left</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
