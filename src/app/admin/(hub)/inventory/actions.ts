'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function updateStock(productId: string, newStock: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const adminSupabase = createAdminClient();
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();
  
  if (profile?.role !== 'owner' && profile?.role !== 'admin' && profile?.role !== 'manager') {
    throw new Error('Forbidden — Insufficient permissions');
  }

  // 1. Update products.stock_quantity
  const { error } = await adminSupabase
    .from('products')
    .update({ stock_quantity: newStock, updated_at: new Date().toISOString() })
    .eq('id', productId);

  if (error) throw new Error(error.message);

  // 2. Sync store_inventory so InventoryPage, Storefront, and POS reflect the change immediately
  const { data: existingInv } = await adminSupabase
    .from('store_inventory')
    .select('id, quantity')
    .eq('product_id', productId)
    .order('id', { ascending: true });

  if (existingInv && existingInv.length === 1) {
    await adminSupabase
      .from('store_inventory')
      .update({ quantity: newStock })
      .eq('id', existingInv[0].id);
  } else if (existingInv && existingInv.length > 1) {
    // Distribute stock across existing variant rows or apply delta to primary variant row
    const currentTotal = existingInv.reduce((sum, row) => sum + (Number(row.quantity) || 0), 0);
    const diff = newStock - currentTotal;
    const firstNewQty = Math.max(0, (Number(existingInv[0].quantity) || 0) + diff);
    await adminSupabase
      .from('store_inventory')
      .update({ quantity: firstNewQty })
      .eq('id', existingInv[0].id);
  } else {
    // No store_inventory rows exist yet — create one if a variant and active store exist
    const [{ data: activeStore }, { data: firstVariant }] = await Promise.all([
      adminSupabase.from('stores').select('id').eq('is_active', true).limit(1).maybeSingle(),
      adminSupabase.from('product_variants').select('id').eq('product_id', productId).limit(1).maybeSingle()
    ]);

    if (activeStore?.id && firstVariant?.id) {
      await adminSupabase.from('store_inventory').insert({
        store_id: activeStore.id,
        product_id: productId,
        variant_id: firstVariant.id,
        quantity: newStock
      });
    }
  }

  // 3. Log action
  await adminSupabase.from('audit_logs').insert({
    user_id: user.id,
    user_name: profile?.full_name || 'Admin',
    user_role: profile?.role || 'manager',
    source: 'admin',
    action: 'update_stock',
    target_type: 'product',
    target_id: productId,
    details: { new_stock: newStock },
  });

  revalidatePath('/admin/inventory');
  revalidatePath('/admin/dashboard');
}
