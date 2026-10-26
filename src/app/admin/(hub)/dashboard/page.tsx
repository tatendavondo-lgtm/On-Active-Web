import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { CombinedMetricsPanel } from '@/components/admin/dashboard/CombinedMetricsPanel';
import { AIInsightBanner } from '@/components/admin/dashboard/AIInsightBanner';
import { RevenueChart } from '@/components/admin/dashboard/RevenueChart';
import { RecentOrdersTable } from '@/components/admin/dashboard/RecentOrdersTable';
import { TopProducts } from '@/components/admin/dashboard/TopProducts';
import { ClosedShiftsTable } from '@/components/admin/dashboard/ClosedShiftsTable';
import { getCombinedMetrics } from '@/lib/admin/getCombinedMetrics';
import type { RevenueDataPoint, TopProduct, StoreContext } from '@/types';
import { getLiveZigRate } from '@/lib/exchangeRates';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/admin/login');
  }

  const adminSupabase = createAdminClient();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const ago90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  // Fetch required data in parallel (removed 6 unused queries)
  const [
    { data: thisMonthOrders },
    { data: todayOrders },
    { data: activeProducts },
    { data: recentOrders },
    { data: allOrders90d },
    { data: thisMonthPosOrders },
    { data: allPosOrders90d },
    { data: allSalesmanOrders90d },
    combinedMetrics,
    zigRate,
  ] = await Promise.all([
    adminSupabase.from('pending_orders').select('total_usd, status').gte('created_at', startOfMonth).eq('status', 'confirmed'),
    adminSupabase.from('pending_orders').select('id').gte('created_at', startOfToday).eq('status', 'pending'),
    adminSupabase.from('products').select('id').eq('is_active', true),
    adminSupabase.from('pending_orders').select('*').order('created_at', { ascending: false }).limit(10),
    adminSupabase.from('pending_orders').select('created_at, total_usd, items').gte('created_at', ago90).neq('status', 'cancelled'),
    adminSupabase.from('pos_orders').select('total, source').eq('status', 'completed').gte('created_at', startOfMonth),
    adminSupabase.from('pos_orders').select('id, created_at, total, source').eq('status', 'completed').gte('created_at', ago90),
    adminSupabase.from('salesman_orders').select('created_at, subtotal, status').gte('created_at', ago90).neq('status', 'cancelled'),
    getCombinedMetrics(),
    getLiveZigRate(),
  ]);

  // Build deduplicated monthly revenue metrics:
  // POS completed orders (walk_in + salesman + online processed at POS) + confirmed webstore orders not yet processed at POS
  const posWalkInAndSalesmanRev = (thisMonthPosOrders ?? [])
    .filter(o => o.source !== 'online')
    .reduce((s, o) => s + (o.total ?? 0), 0);
  const posOnlineRev = (thisMonthPosOrders ?? [])
    .filter(o => o.source === 'online')
    .reduce((s, o) => s + (o.total ?? 0), 0);
  const confirmedWebRev = (thisMonthOrders ?? []).reduce((s, o) => s + (o.total_usd ?? 0), 0);
  const thisRevenue = posWalkInAndSalesmanRev + Math.max(posOnlineRev, confirmedWebRev);

  const chartData: RevenueDataPoint[] = [];

  // Fetch POS order items for top products
  const posOrderIds = (allPosOrders90d ?? []).map(o => o.id).filter(Boolean);
  const { data: posItems90d } = posOrderIds.length > 0
    ? await adminSupabase
        .from('pos_order_items')
        .select('product_id, product_name, quantity, order_id')
        .in('order_id', posOrderIds)
    : { data: [] };

  // Fetch real stock levels from store_inventory (summed across variants & branches per product_id)
  const { data: inventoryData } = await adminSupabase
    .from('store_inventory')
    .select('product_id, quantity');
  const stockMap: Record<string, number> = {};
  for (const inv of inventoryData ?? []) {
    if (inv.product_id) {
      stockMap[inv.product_id] = (stockMap[inv.product_id] ?? 0) + (inv.quantity ?? 0);
    }
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
    totalOrders: (allOrders90d ?? []).length + (allPosOrders90d ?? []).length + (allSalesmanOrders90d ?? []).filter(o => o.status !== 'completed').length,
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
