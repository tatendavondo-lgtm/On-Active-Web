import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { CombinedMetricsPanel } from '@/components/admin/dashboard/CombinedMetricsPanel';
import { getCombinedMetrics } from '@/lib/admin/getCombinedMetrics';
import { AIInsightBanner } from '@/components/admin/dashboard/AIInsightBanner';
import { RevenueChart } from '@/components/admin/dashboard/RevenueChart';
import { RecentOrdersTable } from '@/components/admin/dashboard/RecentOrdersTable';
import { TopProducts } from '@/components/admin/dashboard/TopProducts';
import { ClosedShiftsTable } from '@/components/admin/dashboard/ClosedShiftsTable';
import type { RevenueDataPoint, TopProduct, StoreContext } from '@/types';
import { getLiveZigRate } from '@/lib/exchangeRates';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString();
  const ago90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  // Fetch all data in parallel
  const [
    { data: thisMonthOrders },
    { data: lastMonthOrders },
    { data: todayOrders },
    { data: yesterdayOrders },
    { data: activeProducts },
    { data: recentOrders },
    { data: allOrders90d },
    { data: settings },
    // POS data (via admin client to bypass RLS)
    { data: thisMonthPosOrders },
    { data: lastMonthPosOrders },
    { data: todayPosOrders },
    { data: yesterdayPosOrders },
    { data: allPosOrders90d },
    // Salesman orders for revenue chart
    { data: allSalesmanOrders90d },
  ] = await Promise.all([
    // Online orders
    supabase.from('pending_orders').select('total_usd').gte('created_at', startOfMonth).neq('status', 'cancelled'),
    supabase.from('pending_orders').select('total_usd').gte('created_at', startOfLastMonth).lt('created_at', endOfLastMonth).neq('status', 'cancelled'),
    supabase.from('pending_orders').select('id').gte('created_at', startOfToday),
    supabase.from('pending_orders').select('id').gte('created_at', yesterday).lt('created_at', startOfToday),
    supabase.from('products').select('id').eq('is_active', true),
    supabase.from('pending_orders').select('*').order('created_at', { ascending: false }).limit(10),
    supabase.from('pending_orders').select('created_at, total_usd, items').gte('created_at', ago90).neq('status', 'cancelled'),
    supabase.from('settings').select('key, value'),
    // POS completed orders
    adminSupabase.from('pos_orders').select('total').gte('created_at', startOfMonth).neq('status', 'cancelled'),
    adminSupabase.from('pos_orders').select('total').gte('created_at', startOfLastMonth).lt('created_at', endOfLastMonth).neq('status', 'cancelled'),
    adminSupabase.from('pos_orders').select('id').gte('created_at', startOfToday).eq('status', 'completed'),
    adminSupabase.from('pos_orders').select('id').gte('created_at', yesterday).lt('created_at', startOfToday).eq('status', 'completed'),
    adminSupabase.from('pos_orders').select('id, created_at, total').gte('created_at', ago90).neq('status', 'cancelled'),
    // Salesman orders for revenue chart (all in 90d window)
    adminSupabase.from('salesman_orders').select('created_at, subtotal, status').gte('created_at', ago90).neq('status', 'cancelled'),
  ]);

  const combinedMetrics = await getCombinedMetrics();

  const zigRate = await getLiveZigRate();

  // Build revenue metrics
  const onlineRevenue = (thisMonthOrders ?? []).reduce((s, o) => s + (o.total_usd ?? 0), 0);
  const posRevenue = (thisMonthPosOrders ?? []).reduce((s, o) => s + (o.total ?? 0), 0);
  const thisRevenue = onlineRevenue + posRevenue;

  // Build 90-day chart data is no longer needed here as RevenueChart handles it yearly
  const chartData: RevenueDataPoint[] = [];

  // Fetch POS order items for top products
  const posOrderIds = (allPosOrders90d ?? []).map(o => o.id).filter(Boolean);
  const { data: posItems90d } = posOrderIds.length > 0
    ? await adminSupabase
        .from('pos_order_items')
        .select('product_id, product_name, quantity, order_id')
        .in('order_id', posOrderIds)
    : { data: [] };

  // Fetch real stock levels from store_inventory (joined by product_id)
  const { data: inventoryData } = await adminSupabase
    .from('store_inventory')
    .select('product_id, quantity');
  const stockMap: Record<string, number> = {};
  for (const inv of inventoryData ?? []) {
    if (inv.product_id) stockMap[inv.product_id] = inv.quantity ?? 0;
  }

  // Aggregate top products from all order channels
  const productCount: Record<string, { name: string; count: number; stock: number }> = {};

  // Online orders
  for (const order of allOrders90d ?? []) {
    const items = order.items ?? [];
    for (const item of items) {
      const key = item.productId ?? item.id ?? item.name;
      if (!productCount[key]) {
        productCount[key] = { name: item.name, count: 0, stock: stockMap[key] ?? 0 };
      }
      productCount[key].count += item.quantity ?? 1;
    }
  }

  // POS order items
  for (const item of posItems90d ?? []) {
    const key = item.product_id ?? item.product_name;
    if (!productCount[key]) {
      productCount[key] = { name: item.product_name, count: 0, stock: stockMap[item.product_id] ?? 0 };
    }
    productCount[key].count += item.quantity ?? 1;
    // Refresh stock from live inventory
    if (item.product_id && stockMap[item.product_id] !== undefined) {
      productCount[key].stock = stockMap[item.product_id];
    }
  }

  const topProducts: TopProduct[] = Object.entries(productCount)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([id, v], _, arr) => ({
      id,
      name: v.name,
      orderCount: v.count,
      stock: v.stock,
      maxCount: arr[0][1].count,
    }));

  // Store context for AI
  const storeContext: StoreContext = {
    revenue: thisRevenue,
    totalOrders: (allOrders90d ?? []).length + (allPosOrders90d ?? []).length + (allSalesmanOrders90d ?? []).length,
    productsInStock: activeProducts?.length ?? 0,
    topSeller: topProducts[0]?.name ?? null,
    pendingOrdersCount: (todayOrders ?? []).length,
    zigRate,
    lowStockItems: combinedMetrics.lowStockCount,
  };

  return (
    <div className="space-y-6">
      {/* Metric cards — real-time polling every 4s */}
      <CombinedMetricsPanel metrics={combinedMetrics} />

      {/* AI Insight */}
      <AIInsightBanner storeContext={storeContext} />

      {/* Revenue chart */}
      <RevenueChart initialData={chartData} initialYear={now.getFullYear()} />

      {/* Bottom grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <RecentOrdersTable orders={recentOrders ?? []} />
        </div>
        <div className="flex flex-col gap-6">
          <ClosedShiftsTable shifts={combinedMetrics.closedShiftsToday} />
          <TopProducts products={topProducts} />
        </div>
      </div>
    </div>
  );
}
