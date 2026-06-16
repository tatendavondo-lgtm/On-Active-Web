import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { CombinedMetricsPanel } from '@/components/admin/dashboard/CombinedMetricsPanel';
import { getCombinedMetrics } from '@/lib/admin/getCombinedMetrics';
import { ShoppingBag, AlertTriangle, Store, Users, FileText, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { formatUSD } from '@/lib/admin/utils';

export const dynamic = 'force-dynamic';

export default async function ManagerDashboardPage() {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { data: profile } = await adminSupabase
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
        <p className="text-sm">You are logged in as a Manager, but no stores exist in the database.</p>
      </div>
    );
  }

  const combinedMetrics = await getCombinedMetrics(storeId);

  // Get start of today in Harare timezone
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Harare',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(now);
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  const todayISO = new Date(`${year}-${month}-${day}T00:00:00.000+02:00`).toISOString();

  const [recentPosOrders, lowStockInventory, activeShifts] = await Promise.all([
    adminSupabase
      .from('pos_orders')
      .select('id, order_number, source, status, total, created_at')
      .eq('store_id', storeId)
      .gte('created_at', todayISO)
      .order('created_at', { ascending: false })
      .limit(6),
    adminSupabase
      .from('store_inventory')
      .select('id, quantity, product:products(name)')
      .eq('store_id', storeId)
      .lte('quantity', 5)
      .limit(6),
    adminSupabase
      .from('shifts')
      .select('id, opened_at, employee:employees(full_name, role)')
      .eq('store_id', storeId)
      .eq('status', 'open')
      .gte('opened_at', todayISO)
  ]);

  return (
    <div className="space-y-6">
      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111]/50 border border-[#1f1f1f] p-6 rounded-[12px] backdrop-blur-md">
        <div>
          <span className="text-[#C5A021] text-[10px] font-bold uppercase tracking-widest bg-[#C5A021]/10 px-2 py-0.5 rounded border border-[#C5A021]/20">
            Store Command Center
          </span>
          <h2 className="text-white font-bold text-2xl tracking-tight mt-2 flex items-center gap-2">
            <Store className="text-[#888]" size={20} />
            {storeName}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/orders" className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] text-white text-xs font-bold uppercase tracking-wider rounded-[6px] transition-all hover:border-[#444]">
            <ShoppingBag size={14} className="text-[#C5A021]" /> POS Terminal
          </Link>
          <Link href="/admin/inventory" className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] text-white text-xs font-bold uppercase tracking-wider rounded-[6px] transition-all hover:border-[#444]">
            <ClipboardList size={14} className="text-blue-400" /> Inventory
          </Link>
          <Link href="/admin/staff" className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] text-white text-xs font-bold uppercase tracking-wider rounded-[6px] transition-all hover:border-[#444]">
            <Users size={14} className="text-emerald-400" /> Staff
          </Link>
        </div>
      </div>

      <CombinedMetricsPanel metrics={combinedMetrics} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent POS Orders */}
        <div className="lg:col-span-2 bg-gradient-to-b from-[#111] to-[#0a0a0a] border border-[#1f1f1f] rounded-[12px] p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-[#C5A021]/0 via-[#C5A021]/5 to-[#C5A021]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
          <div className="flex items-center justify-between mb-6 relative z-10">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2">
              <FileText size={16} className="text-[#C5A021]" /> Recent Transactions
            </h3>
            <Link href="/admin/orders" className="text-[#888] hover:text-[#C5A021] text-xs font-bold uppercase tracking-wider transition-colors">
              View All
            </Link>
          </div>
          {recentPosOrders.data?.length === 0 ? (
            <div className="py-12 text-center text-[#444] text-xs font-medium uppercase tracking-wider border border-dashed border-[#222] rounded-[8px]">
              No transactions logged today.
            </div>
          ) : (
            <div className="divide-y divide-[#1f1f1f] relative z-10">
              {recentPosOrders.data?.map(o => (
                <div key={o.id} className="py-3.5 flex items-center justify-between text-sm group/row hover:bg-[#1a1a1a]/50 px-2 -mx-2 rounded transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded bg-[#1a1a1a] flex items-center justify-center border border-[#2a2a2a]`}>
                      <ShoppingBag size={14} className={o.source === 'walk_in' ? 'text-[#888]' : 'text-blue-400'} />
                    </div>
                    <div>
                      <p className="text-white font-mono font-semibold">{o.order_number}</p>
                      <p className="text-[#666] text-xs capitalize">{o.source.replace('_', ' ')} · {new Date(o.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold font-mono text-[15px]">{formatUSD(o.total)}</p>
                    <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">
                      {o.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Active Shifts Component */}
          <div className="bg-gradient-to-b from-[#111] to-[#0a0a0a] border border-[#1f1f1f] rounded-[12px] p-6 shadow-xl relative overflow-hidden group">
            <div className="flex items-center justify-between mb-5 relative z-10">
              <h3 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                <Users size={16} className="text-emerald-500" /> On Floor Now
              </h3>
              <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded">
                {activeShifts.data?.length || 0} Active
              </span>
            </div>
            {activeShifts.data?.length === 0 ? (
              <div className="py-8 text-center text-[#444] text-xs font-medium uppercase tracking-wider border border-dashed border-[#222] rounded-[8px]">
                No staff clocked in
              </div>
            ) : (
              <div className="space-y-3 relative z-10">
                {activeShifts.data?.map(shift => {
                  const emp = shift.employee as any;
                  return (
                    <div key={shift.id} className="flex items-center gap-3 bg-[#161616] border border-[#222] p-3 rounded-[8px] hover:border-[#333] transition-colors">
                      <div className="w-8 h-8 rounded-full bg-[#222] border border-[#333] flex items-center justify-center text-white text-xs font-bold">
                        {emp?.full_name?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{emp?.full_name}</p>
                        <p className="text-[#666] text-[10px] uppercase tracking-wider">{emp?.role}</p>
                      </div>
                      <div className="text-right">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-gradient-to-b from-[#111] to-[#0a0a0a] border border-[#1f1f1f] rounded-[12px] p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/5 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
            <div className="flex items-center justify-between mb-5 relative z-10">
              <h3 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle size={16} className={combinedMetrics.lowStockCount > 0 ? "text-red-500" : "text-amber-500"} /> Low Stock
              </h3>
              {combinedMetrics.lowStockCount > 0 && (
                <span className="text-red-400 bg-red-500/10 border border-red-500/20 text-[10px] font-bold px-2 py-0.5 rounded animate-pulse">
                  {combinedMetrics.lowStockCount} Critical
                </span>
              )}
            </div>
            {lowStockInventory.data?.length === 0 ? (
              <div className="py-8 text-center text-[#444] text-xs font-medium uppercase tracking-wider border border-dashed border-[#222] rounded-[8px]">
                Inventory fully stocked
              </div>
            ) : (
              <div className="divide-y divide-[#1f1f1f] relative z-10">
                {lowStockInventory.data?.map(i => (
                  <div key={i.id} className="py-3 flex items-center justify-between text-sm group/row">
                    <span className="text-[#ccc] truncate max-w-[160px]">{(i.product as any)?.name}</span>
                    <span className={`font-mono font-bold text-[13px] px-2 py-0.5 rounded ${i.quantity === 0 ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                      {i.quantity} left
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
