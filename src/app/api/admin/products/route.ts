import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminSupabase = createAdminClient();
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['owner', 'manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden. Not an admin.' }, { status: 403 });
    }

    const payload = await req.json();

    const { data: result, error } = payload.id
      ? await adminSupabase.from('products').update(payload).eq('id', payload.id).select().single()
      : await adminSupabase.from('products').insert(payload).select().single();

    if (error) {
       console.error('Database error in products API:', error);
       return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (result) {
      const productId = result.id;
      const sizes = result.sizes || [];
      const defaultStoreId = '00000000-0000-0000-0000-000000000001';

      // 1. Get existing variants
      const { data: existingVariants } = await adminSupabase
        .from('product_variants')
        .select('id, name')
        .eq('product_id', productId);

      // 2. Determine which variants to add, update or remove
      const existingNames = (existingVariants || []).map(v => v.name);
      
      // If no sizes, create a 'Standard' variant
      const targetSizes = sizes.length > 0 ? sizes : ['Standard'];

      // Add missing variants
      for (const size of targetSizes) {
        if (!existingNames.includes(size)) {
          const { data: newVar } = await adminSupabase
            .from('product_variants')
            .insert({
              product_id: productId,
              name: size,
              price: result.price_usd,
              created_at: new Date().toISOString()
            })
            .select()
            .single();

          if (newVar) {
            // Initialize inventory for this variant
            await adminSupabase.from('store_inventory').insert({
              store_id: defaultStoreId,
              product_id: productId,
              variant_id: newVar.id,
              quantity: sizes.length > 0 ? 0 : (result.stock_quantity || 0)
            });
          }
        }
      }

      // 3. Ensure global inventory is initialized if it's a new product with no variants
      if (!payload.id && sizes.length === 0) {
        const { data: existingInv } = await adminSupabase
          .from('store_inventory')
          .select('id')
          .eq('store_id', defaultStoreId)
          .eq('product_id', productId)
          .is('variant_id', null)
          .single();

        if (!existingInv) {
          await adminSupabase.from('store_inventory').insert({
            store_id: defaultStoreId,
            product_id: productId,
            variant_id: null,
            quantity: result.stock_quantity || 0
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Server error in products API:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
