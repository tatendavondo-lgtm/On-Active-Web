import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { logAuditAction } from '@/lib/admin/audit';
import { UTApi } from 'uploadthing/server';

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

    // Check for removed images to delete from UploadThing
    if (payload.id && productData.images) {
      const { data: oldProduct } = await adminSupabase.from('products').select('images').eq('id', payload.id).single();
      if (oldProduct && oldProduct.images) {
        const removedImages = oldProduct.images.filter((oldImg: string) => !productData.images.includes(oldImg));
        if (removedImages.length > 0) {
          const fileKeys = removedImages.map((url: string) => {
            const parts = url.split('/f/');
            return parts.length > 1 ? parts[1] : null;
          }).filter(Boolean) as string[];
          if (fileKeys.length > 0) {
            try {
              const utapi = new UTApi();
              await utapi.deleteFiles(fileKeys);
            } catch (e) {
              console.error("Failed to delete removed images from UploadThing", e);
            }
          }
        }
      }
    }

    const { data: result, error } = payload.id
      ? await adminSupabase.from('products').update(productData).eq('id', payload.id).select().single()
      : await adminSupabase.from('products').insert(productData).select().single();

    if (error) {
       console.error('Database error in products API:', error);
       return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (result) {
      // Log the action
      await logAuditAction({
        action: payload.id ? 'update_product' : 'create_product',
        targetType: 'product',
        targetId: result.id,
        details: { name: result.name, stock: result.stock_quantity }
      });

      const productId = result.id;
      const { data: activeStore } = await adminSupabase
        .from('stores')
        .select('id')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();
      const defaultStoreId = payload.store_id || activeStore?.id || '00000000-0000-0000-0000-000000000001';

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

export async function DELETE(req: NextRequest) {
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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing product ID' }, { status: 400 });
    }

    // Fetch product images to delete from UploadThing
    const { data: product } = await adminSupabase.from('products').select('images').eq('id', id).single();

    // Associated variants and inventory will be deleted via ON DELETE CASCADE if configured in DB,
    // otherwise we handle it manually here to be safe.
    await adminSupabase.from('store_inventory').delete().eq('product_id', id);
    await adminSupabase.from('product_variants').delete().eq('product_id', id);
    const { error } = await adminSupabase.from('products').delete().eq('id', id);

    if (error) throw error;

    if (product && product.images && product.images.length > 0) {
      const fileKeys = product.images.map((url: string) => {
        const parts = url.split('/f/');
        return parts.length > 1 ? parts[1] : null;
      }).filter(Boolean) as string[];

      if (fileKeys.length > 0) {
        try {
          const utapi = new UTApi();
          await utapi.deleteFiles(fileKeys);
        } catch (e) {
          console.error("Failed to delete images from UploadThing", e);
        }
      }
    }

    await logAuditAction({
      action: 'delete_product',
      targetType: 'product',
      targetId: id,
      details: { id }
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Delete error:', err);
    if (err.message?.includes('violates foreign key constraint')) {
      return NextResponse.json({ 
        error: 'This product cannot be permanently deleted because it is linked to past sales or inventory records. Please mark it as "Inactive" instead to hide it from your stores.' 
      }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
