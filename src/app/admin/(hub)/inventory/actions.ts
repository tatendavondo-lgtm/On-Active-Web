'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function updateStock(productId: string, newStock: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const adminSupabase = createAdminClient();
  const { data: profile } = await adminSupabase.from('profiles').select('role, full_name').eq('id', user.id).single();
  
  if (profile?.role !== 'owner' && profile?.role !== 'admin' && profile?.role !== 'manager') {
    throw new Error('Forbidden — Insufficient permissions');
  }

  const { error } = await adminSupabase
    .from('products')
    .update({ stock_quantity: newStock, updated_at: new Date().toISOString() })
    .eq('id', productId);

  if (error) throw new Error(error.message);

  // Log action
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
}
