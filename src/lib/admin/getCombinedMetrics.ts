import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function getCombinedMetrics(storeIdFilter?: string) {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Queries for webstore and POS
  let posQuery = adminSupabase
    .from('pos_orders')
    .select('id, total, source, status, created_at')
    .eq('status', 'completed')
    .gte('created_at', today.toISOString());

  let bridgeQuery = adminSupabase
    .from('online_order_bridge')
    .select('id, total, status, fulfillment')
    .not('status', 'in', '("completed","cancelled")');

  let openShiftsQuery = adminSupabase
    .from('shifts')
    .select('id, employee_id, store_id, employees!inner(role)')
    .eq('status', 'open');

  let lowStockQuery = adminSupabase
    .from('store_inventory')
    .select('id, quantity')
    .lte('quantity', 5);

  if (storeIdFilter) {
    posQuery = posQuery.eq('store_id', storeIdFilter);
    bridgeQuery = bridgeQuery.eq('store_id', storeIdFilter);
    openShiftsQuery = openShiftsQuery.eq('store_id', storeIdFilter);
    lowStockQuery = lowStockQuery.eq('store_id', storeIdFilter);
  }

  // Fetch in parallel
  const [webOrders, posOrders, bridgeOrders, openShifts, lowStock] = await Promise.all([
    // Webstore orders today (only makes sense for owner view, but we can fetch it always)
    supabase
      .from('pending_orders')
      .select('id, total_usd, status, created_at')
      .neq('status', 'cancelled')
      .gte('created_at', today.toISOString()),

    // POS completed orders today
    posQuery,

    // Online orders pending fulfillment
    bridgeQuery,

    // Open shifts
    openShiftsQuery,

    // Low stock
    lowStockQuery
  ]);

  const webRevenue = webOrders.data?.reduce((sum, o) => sum + (o.total_usd || 0), 0) || 0;
  const webCount = webOrders.data?.length || 0;

  const posRevenue = posOrders.data?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
  const posCount = posOrders.data?.length || 0;
  const posWalkIn = posOrders.data?.filter(o => o.source === 'walk_in').length || 0;
  const posSalesman = posOrders.data?.filter(o => o.source === 'salesman').length || 0;

  // Pending online orders from bridge
  const bridgeTotal = bridgeOrders.data?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
  const bridgePending = bridgeOrders.data?.filter(o => o.status === 'pending').length || 0;
  const bridgeInProgress = bridgeOrders.data?.filter(o => ['confirmed','preparing','ready'].includes(o.status)).length || 0;

  // Shifts
  const shiftsCount = openShifts.data?.length || 0;
  // Note: openShifts returns nested employees object due to !inner(role)
  const salesmenOnFloor = openShifts.data?.filter(s => (s.employees as any)?.role === 'salesman').length || 0;

  return {
    webstore: {
      revenue: webRevenue,
      count: webCount,
    },
    pos: {
      revenue: posRevenue,
      count: posCount,
      walkIn: posWalkIn,
      salesman: posSalesman,
    },
    online: {
      revenue: bridgeTotal,
      pending: bridgePending,
      inProgress: bridgeInProgress,
      count: (bridgeOrders.data?.length || 0),
    },
    totalRevenue: webRevenue + posRevenue,
    totalOrdersToday: webCount + posCount,
    openShifts: shiftsCount,
    salesmenOnFloor: salesmenOnFloor,
    lowStockCount: lowStock.data?.length || 0,
  };
}
