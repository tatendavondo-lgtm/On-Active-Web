import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { MetricCards } from '@/components/admin/dashboard/MetricCards';
import { AIInsightBanner } from '@/components/admin/dashboard/AIInsightBanner';
import { RevenueChart } from '@/components/admin/dashboard/RevenueChart';
import { RecentOrdersTable } from '@/components/admin/dashboard/RecentOrdersTable';
import { TopProducts } from '@/components/admin/dashboard/TopProducts';
import type { DashboardMetrics, RevenueDataPoint, TopProduct, StoreContext } from '@/types';
import { getPercentChange } from '@/lib/admin/utils';

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

  // Fetch online + POS data in parallel
  const [
    { data: thisMonthOrders },
    { data: lastMonthOrders },
    { data: todayOrders },
    { data: yesterdayOrders },
    { data: activeProducts },
    { data: lowStockProducts },
    { data: recentOrders },
    { data: allOrders90d },
    { data: settings },
    // POS data (via admin client to bypass RLS)
    { data: thisMonthPosOrders },
    { data: lastMonthPosOrders },
    { data: todayPosOrders },
    { data: yesterdayPosOrders },
    { data: allPosOrders90d },
  ] = await Promise.all([
    // Online orders
    supabase.from('pending_orders').select('total_usd').gte('created_at', startOfMonth).neq('status', 'cancelled'),
    supabase.from('pending_orders').select('total_usd').gte('created_at', startOfLastMonth).lt('created_at', endOfLastMonth).neq('status', 'cancelled'),
    supabase.from('pending_orders').select('id').gte('created_at', startOfToday),
    supabase.from('pending_orders').select('id').gte('created_at', yesterday).lt('created_at', startOfToday),
    supabase.from('products').select('id').eq('is_active', true),
    adminSupabase.from('store_inventory').select('id, quantity').lte('quantity', 5),
    supabase.from('pending_orders').select('*').order('created_at', { ascending: false }).limit(10),
    supabase.from('pending_orders').select('created_at, total_usd, items').gte('created_at', ago90).neq('status', 'cancelled'),
    supabase.from('settings').select('key, value'),
    // POS orders (may not exist yet, will gracefully return empty)
    adminSupabase.from('pos_orders').select('total').gte('created_at', startOfMonth).neq('status', 'cancelled'),
    adminSupabase.from('pos_orders').select('total').gte('created_at', startOfLastMonth).lt('created_at', endOfLastMonth).neq('status', 'cancelled'),
    adminSupabase.from('pos_orders').select('id').gte('created_at', startOfToday),
    adminSupabase.from('pos_orders').select('id').gte('created_at', yesterday).lt('created_at', startOfToday),
    adminSupabase.from('pos_orders').select('id, created_at, total').gte('created_at', ago90).neq('status', 'cancelled'),
  ]);

  const zigRate = Number(settings?.find((s) => s.key === 'zig_rate')?.value ?? 13500);

  // Build metrics — combine online + POS revenue
  const onlineRevenue = (thisMonthOrders ?? []).reduce((s, o) => s + (o.total_usd ?? 0), 0);
  const posRevenue = (thisMonthPosOrders ?? []).reduce((s, o) => s + (o.total ?? 0), 0);
  const thisRevenue = onlineRevenue + posRevenue;

  const lastOnlineRevenue = (lastMonthOrders ?? []).reduce((s, o) => s + (o.total_usd ?? 0), 0);
  const lastPosRevenue = (lastMonthPosOrders ?? []).reduce((s, o) => s + (o.total ?? 0), 0);
  const lastRevenue = lastOnlineRevenue + lastPosRevenue;

  const totalOrdersToday = (todayOrders?.length ?? 0) + (todayPosOrders?.length ?? 0);
  const totalOrdersYesterday = (yesterdayOrders?.length ?? 0) + (yesterdayPosOrders?.length ?? 0);

  const metrics: DashboardMetrics = {
    totalRevenue: thisRevenue,
    ordersToday: totalOrdersToday,
    activeProducts: activeProducts?.length ?? 0,
    lowStockItems: lowStockProducts?.length ?? 0,
    revenueChange: getPercentChange(thisRevenue, lastRevenue),
    ordersTodayChange: getPercentChange(totalOrdersToday, totalOrdersYesterday),
  };

  // Build 90-day revenue chart data — combine both channels
  const revenueByDay: Record<string, number> = {};
  for (const order of allOrders90d ?? []) {
    const day = order.created_at.slice(0, 10);
    revenueByDay[day] = (revenueByDay[day] ?? 0) + (order.total_usd ?? 0);
  }
  for (const order of allPosOrders90d ?? []) {
    const day = order.created_at.slice(0, 10);
    revenueByDay[day] = (revenueByDay[day] ?? 0) + (order.total ?? 0);
  }
  const chartData: RevenueDataPoint[] = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    chartData.push({
      date: key,
      label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      revenue: revenueByDay[key] ?? 0,
    });
  }

  // Top products by order count — combine online items
  const productCount: Record<string, { name: string; count: number; stock: number }> = {};
  for (const order of allOrders90d ?? []) {
    const items = order.items ?? [];
    for (const item of items) {
      if (!productCount[item.productId]) {
        productCount[item.productId] = { name: item.name, count: 0, stock: 0 };
      }
      productCount[item.productId].count += item.quantity ?? 1;
    }
  }

  // Also fetch POS order items for top product calculation
  const { data: posItems90d } = await adminSupabase
    .from('pos_order_items')
    .select('product_id, product_name, quantity, order_id')
    .in('order_id', (allPosOrders90d ?? []).map(o => o.id).filter(Boolean));

  for (const item of posItems90d ?? []) {
    const key = item.product_id;
    if (!productCount[key]) {
      productCount[key] = { name: item.product_name, count: 0, stock: 0 };
    }
    productCount[key].count += item.quantity ?? 1;
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

  // Store context for AI — now includes POS data
  const storeContext: StoreContext = {
    revenue: thisRevenue,
    totalOrders: (allOrders90d ?? []).length + (allPosOrders90d ?? []).length,
    productsInStock: activeProducts?.length ?? 0,
    topSeller: topProducts[0]?.name ?? null,
    pendingOrdersCount: (todayOrders ?? []).length,
    zigRate,
    lowStockItems: lowStockProducts?.length ?? 0,
  };

  return (
    <div className="space-y-6">
      {/* Metric cards */}
      <MetricCards metrics={metrics} />

      {/* AI Insight */}
      <AIInsightBanner storeContext={storeContext} />

      {/* Revenue chart */}
      <RevenueChart data={chartData} />

      {/* Bottom grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <RecentOrdersTable orders={recentOrders ?? []} />
        </div>
        <div>
          <TopProducts products={topProducts} />
        </div>
      </div>
    </div>
  );
}

