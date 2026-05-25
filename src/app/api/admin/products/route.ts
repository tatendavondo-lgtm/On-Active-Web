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
    const { variants: incomingVariants, ...productData } = payload;

    const { data: result, error } = payload.id
      ? await adminSupabase.from('products').update(productData).eq('id', payload.id).select().single()
      : await adminSupabase.from('products').insert(productData).select().single();

    if (error) {
       console.error('Database error in products API:', error);
       return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (result) {
      const productId = result.id;
      const defaultStoreId = '00000000-0000-0000-0000-000000000001';

      // If explicit variants are provided (from the new UI)
      if (incomingVariants && Array.isArray(incomingVariants)) {
        for (const v of incomingVariants) {
          // Check if variant already exists
          const { data: existing } = await adminSupabase
            .from('product_variants')
            .select('id')
            .eq('product_id', productId)
            .eq('size', v.size)
            .eq('color', v.color)
            .maybeSingle();

          let variantId = existing?.id;

          if (!variantId) {
            const { data: newV } = await adminSupabase
              .from('product_variants')
              .insert({
                product_id: productId,
                name: `${v.size} / ${v.color}`,
                size: v.size,
                color: v.color,
                price: v.price || result.price_usd,
                created_at: new Date().toISOString()
              })
              .select()
              .single();
            variantId = newV?.id;
          } else {
            // Update price if it changed
            await adminSupabase
              .from('product_variants')
              .update({ price: v.price || result.price_usd })
              .eq('id', variantId);
          }

          if (variantId) {
            // Ensure inventory record exists
            const { data: inv } = await adminSupabase
              .from('store_inventory')
              .select('id')
              .eq('store_id', defaultStoreId)
              .eq('product_id', productId)
              .eq('variant_id', variantId)
              .maybeSingle();

            if (!inv) {
              await adminSupabase.from('store_inventory').insert({
                store_id: defaultStoreId,
                product_id: productId,
                variant_id: variantId,
                quantity: v.stock || 0
              });
            } else if (v.stock !== undefined) {
              // Update stock if provided
              await adminSupabase.from('store_inventory').update({ quantity: v.stock }).eq('id', inv.id);
            }
          }
        }
      } else {
        // LEGACY/FALLBACK: Auto-generate variants from the 'sizes' array if no explicit variants provided
        const sizes = result.sizes || [];
        const targetSizes = sizes.length > 0 ? sizes : ['Standard'];

        for (const size of targetSizes) {
          const { data: existing } = await adminSupabase
            .from('product_variants')
            .select('id')
            .eq('product_id', productId)
            .eq('size', size)
            .maybeSingle();

          if (!existing) {
            const { data: newVar } = await adminSupabase
              .from('product_variants')
              .insert({
                product_id: productId,
                name: size,
                size: size,
                price: result.price_usd,
                created_at: new Date().toISOString()
              })
              .select()
              .single();

            if (newVar) {
              await adminSupabase.from('store_inventory').insert({
                store_id: defaultStoreId,
                product_id: productId,
                variant_id: newVar.id,
                quantity: sizes.length > 0 ? 0 : (result.stock_quantity || 0)
              });
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Server error in products API:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
