import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { LowStockAlert } from '@/components/admin/inventory/LowStockAlert';
import { InventoryTable } from '@/components/admin/inventory/InventoryTable';
import type { InventoryItem } from '@/types';
import { calculateStockoutDays, calculateSuggestedRestock } from '@/lib/admin/utils';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/admin/login');
  }

  const adminSupabase = createAdminClient();

  const ago30 = new Date(Date.now() - 30 * 86400000).toISOString();
  const ago7 = new Date(Date.now() - 7 * 86400000).toISOString();

  const [{ data: products }, { data: inventory }, { data: orders30d }, { data: posOrders30d }] = await Promise.all([
    supabase.from('products').select('*').order('name'),
    adminSupabase.from('store_inventory').select('*'),
    supabase
      .from('pending_orders')
      .select('items, created_at')
      .gte('created_at', ago30)
      .neq('status', 'cancelled'),
    // Fetch POS order items from the last 30 days
    adminSupabase
      .from('pos_order_items')
      .select('product_id, quantity, created_at')
      .gte('created_at', ago30),
  ]);

  const invMap: Record<string, number> = {};
  (inventory || []).forEach(item => {
    // If multiple variants exist, we'll sum them for this simple view or show them as variants if the table supports it
    // For now, we sum the stock per product_id for this main view
    invMap[item.product_id] = (invMap[item.product_id] ?? 0) + item.quantity;
  });

  // Build sales maps from online orders
  const sales30: Record<string, number> = {};
  const sales7: Record<string, number> = {};
  for (const order of orders30d ?? []) {
    const is7d = order.created_at >= ago7;
    for (const item of order.items ?? []) {
      sales30[item.productId] = (sales30[item.productId] ?? 0) + (item.quantity ?? 1);
      if (is7d) sales7[item.productId] = (sales7[item.productId] ?? 0) + (item.quantity ?? 1);
    }
  }

  // Add POS sales into the same maps
  for (const item of posOrders30d ?? []) {
    const key = item.product_id;
    sales30[key] = (sales30[key] ?? 0) + (item.quantity ?? 1);
    if (item.created_at >= ago7) {
      sales7[key] = (sales7[key] ?? 0) + (item.quantity ?? 1);
    }
  }

  const inventoryItems: InventoryItem[] = (products ?? []).map((p) => {
    const s30 = sales30[p.id] ?? 0;
    const s7 = sales7[p.id] ?? 0;
    const dailyVelocity = s30 / 30;
    const stock = invMap[p.id] !== undefined ? invMap[p.id] : (p.stock_quantity ?? 0);
    const daysUntilStockout = calculateStockoutDays(stock, dailyVelocity);
    return {
      ...p,
      stock_quantity: stock,
      salesLast7Days: s7,
      salesLast30Days: s30,
      dailyVelocity,
      daysUntilStockout,
      suggestedRestock: calculateSuggestedRestock(dailyVelocity),
    };
  });

  const lowStock = inventoryItems.filter((p) => p.stock_quantity <= 5);

  return (
    <div className="space-y-6">
      {lowStock.length > 0 && <LowStockAlert items={lowStock} />}
      <InventoryTable inventory={inventoryItems} />
    </div>
  );
}

