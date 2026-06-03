import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function getCombinedMetrics(storeIdFilter?: string) {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  // Queries for webstore and POS
  let posQuery = adminSupabase
    .from('pos_orders')
    .select('id, total, source, status, created_at')
    .eq('status', 'completed')
    .gte('created_at', todayISO);

  let bridgeQuery = adminSupabase
    .from('online_order_bridge')
    .select('id, total, status, fulfillment')
    .not('status', 'in', '("completed","cancelled")');

  // All currently open shifts — any open shift is an active shift regardless of when opened
  let openShiftsQuery = adminSupabase
    .from('shifts')
    .select('id, employee_id, store_id, opened_at, employees(role)')
    .eq('status', 'open');

  let lowStockQuery = adminSupabase
    .from('store_inventory')
    .select('id, quantity')
    .lte('quantity', 5);

  let salesmanQuery = adminSupabase
    .from('salesman_orders')
    .select('id, subtotal, status, created_at')
    .gte('created_at', todayISO);

  if (storeIdFilter) {
    posQuery = posQuery.eq('store_id', storeIdFilter);
    bridgeQuery = bridgeQuery.eq('store_id', storeIdFilter);
    openShiftsQuery = openShiftsQuery.eq('store_id', storeIdFilter);
    lowStockQuery = lowStockQuery.eq('store_id', storeIdFilter);
    salesmanQuery = salesmanQuery.eq('store_id', storeIdFilter);
  }

  // Fetch in parallel
  const [webOrders, posOrders, bridgeOrders, openShifts, lowStock, salesmanOrders] = await Promise.all([
    // Webstore orders today
    supabase
      .from('pending_orders')
      .select('id, total_usd, status, created_at')
      .neq('status', 'cancelled')
      .gte('created_at', todayISO),

    // POS completed orders today
    posQuery,

    // Online orders pending fulfillment
    bridgeQuery,

    // Open shifts (today only — avoids stale shifts)
    openShiftsQuery,

    // Low stock
    lowStockQuery,

    // Salesman orders today (all statuses)
    salesmanQuery,
  ]);

  const webRevenue = webOrders.data?.reduce((sum, o) => sum + (o.total_usd || 0), 0) || 0;
  const webCount = webOrders.data?.length || 0;

  const posRevenue = posOrders.data?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
  const posCount = posOrders.data?.length || 0;
  const posWalkIn = posOrders.data?.filter(o => o.source === 'walk_in').length || 0;

  // Count all salesman orders created today (both pending, accepted and completed)
  const posSalesman = salesmanOrders.data?.length || 0;

  // Salesman revenue (include pending & accepted — real money in the pipeline, exclude completed because they are in posRevenue)
  const salesmanRevenue = salesmanOrders.data?.filter(o => o.status !== 'completed' && o.status !== 'cancelled').reduce((sum, o) => sum + (o.subtotal || 0), 0) || 0;

  // Pending online orders from bridge
  const bridgeTotal = bridgeOrders.data?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
  const bridgePending = bridgeOrders.data?.filter(o => o.status === 'pending').length || 0;
  const bridgeInProgress = bridgeOrders.data?.filter(o => ['confirmed', 'preparing', 'ready'].includes(o.status)).length || 0;

  // Shifts — only those opened today
  const shiftsCount = openShifts.data?.length || 0;
  const salesmenOnFloor = openShifts.data?.filter(s => (s.employees as any)?.role === 'salesman').length || 0;

  // Active (non-completed/non-cancelled) salesman orders count toward live orders today
  const pendingSalesmanCount = salesmanOrders.data?.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length || 0;

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
    // Total revenue = completed POS + online webstore + salesman pipeline
    totalRevenue: webRevenue + posRevenue + salesmanRevenue,
    totalOrdersToday: webCount + posCount + pendingSalesmanCount,
    openShifts: shiftsCount,
    salesmenOnFloor: salesmenOnFloor,
    lowStockCount: lowStock.data?.length || 0,
  };
}
