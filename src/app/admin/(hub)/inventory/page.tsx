import { createClient } from '@/lib/supabase/server';
import { LowStockAlert } from '@/components/admin/inventory/LowStockAlert';
import { InventoryTable } from '@/components/admin/inventory/InventoryTable';
import type { InventoryItem } from '@/types';
import { calculateStockoutDays, calculateSuggestedRestock } from '@/lib/admin/utils';

export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
  const supabase = await createClient();

  const [{ data: products }, { data: orders30d }] = await Promise.all([
    supabase.from('products').select('*').order('stock_quantity', { ascending: true }),
    supabase
      .from('pending_orders')
      .select('items, created_at')
      .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString())
      .neq('status', 'cancelled'),
  ]);

  const ago7d = new Date(Date.now() - 7 * 86400000).toISOString();

  // Build sales maps
  const sales30: Record<string, number> = {};
  const sales7: Record<string, number> = {};
  for (const order of orders30d ?? []) {
    const is7d = order.created_at >= ago7d;
    for (const item of order.items ?? []) {
      sales30[item.productId] = (sales30[item.productId] ?? 0) + (item.quantity ?? 1);
      if (is7d) sales7[item.productId] = (sales7[item.productId] ?? 0) + (item.quantity ?? 1);
    }
  }

  const inventory: InventoryItem[] = (products ?? []).map((p) => {
    const s30 = sales30[p.id] ?? 0;
    const s7 = sales7[p.id] ?? 0;
    const dailyVelocity = s30 / 30;
    const daysUntilStockout = calculateStockoutDays(p.stock_quantity, dailyVelocity);
    return {
      ...p,
      salesLast7Days: s7,
      salesLast30Days: s30,
      dailyVelocity,
      daysUntilStockout,
      suggestedRestock: calculateSuggestedRestock(dailyVelocity),
    };
  });

  const lowStock = inventory.filter((p) => p.stock_quantity <= 5);

  return (
    <div className="space-y-6">
      {lowStock.length > 0 && <LowStockAlert items={lowStock} />}
      <InventoryTable inventory={inventory} />
    </div>
  );
}
