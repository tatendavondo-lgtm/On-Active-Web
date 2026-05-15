import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { AIChat } from '@/components/admin/ai/AIChat';
import type { StoreContext } from '@/types';

export const dynamic = 'force-dynamic';

export default async function AIPage() {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const ago30 = new Date(Date.now() - 30 * 86400000).toISOString();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const [
    { data: thisMonthOrders },
    { data: products },
    { data: pendingToday },
    { data: settings },
    { data: orders30d },
    // POS data
    { data: thisMonthPosOrders },
    { data: posOrders30d },
  ] = await Promise.all([
    supabase.from('pending_orders').select('total_usd').gte('created_at', startOfMonth).neq('status', 'cancelled'),
    supabase.from('products').select('id, name, stock_quantity, is_active').eq('is_active', true),
    supabase.from('pending_orders').select('id').gte('created_at', today).eq('status', 'pending'),
    supabase.from('settings').select('key, value'),
    supabase.from('pending_orders').select('items').gte('created_at', ago30).neq('status', 'cancelled'),
    // POS
    adminSupabase.from('pos_orders').select('total').gte('created_at', startOfMonth).neq('status', 'cancelled'),
    adminSupabase.from('pos_orders').select('id, total').gte('created_at', ago30).neq('status', 'cancelled'),
  ]);

  const zigRate = Number(settings?.find((s) => s.key === 'zig_rate')?.value ?? 13500);
  const onlineRevenue = (thisMonthOrders ?? []).reduce((s, o) => s + (o.total_usd ?? 0), 0);
  const posRevenue = (thisMonthPosOrders ?? []).reduce((s, o) => s + (o.total ?? 0), 0);
  const revenue = onlineRevenue + posRevenue;

  // Top sellers from 30d online orders
  const salesMap: Record<string, { name: string; count: number }> = {};
  for (const order of orders30d ?? []) {
    for (const item of order.items ?? []) {
      if (!salesMap[item.productId]) salesMap[item.productId] = { name: item.name, count: 0 };
      salesMap[item.productId].count += item.quantity ?? 1;
    }
  }

  // Add POS item sales
  const { data: posItems30d } = await adminSupabase
    .from('pos_order_items')
    .select('product_id, product_name, quantity')
    .in('order_id', (posOrders30d ?? []).map(o => o.id).filter(Boolean));

  for (const item of posItems30d ?? []) {
    if (!salesMap[item.product_id]) salesMap[item.product_id] = { name: item.product_name, count: 0 };
    salesMap[item.product_id].count += item.quantity ?? 1;
  }

  const topSeller = Object.values(salesMap).sort((a, b) => b.count - a.count)[0]?.name ?? null;
  const lowStock = (products ?? []).filter((p) => p.stock_quantity <= 5).length;

  const totalOrders = (orders30d ?? []).length + (posOrders30d ?? []).length;

  const storeContext: StoreContext = {
    revenue,
    totalOrders,
    productsInStock: (products ?? []).length,
    topSeller,
    pendingOrdersCount: pendingToday?.length ?? 0,
    zigRate,
    lowStockItems: lowStock,
    inventorySnapshot: (products ?? []).map((p) => ({
      name: p.name,
      stock: p.stock_quantity,
      salesLast30Days: salesMap[p.id]?.count ?? 0,
    })),
  };

  return <AIChat initialContext={storeContext} />;
}

