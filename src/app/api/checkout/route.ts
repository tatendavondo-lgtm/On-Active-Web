import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    
    // Minimum validation
    if (!payload.order_ref || !Array.isArray(payload.items) || payload.items.length === 0 || payload.total_usd === undefined) {
      return NextResponse.json({ error: 'Missing required order fields' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();
    
    // --- 1. PREVENT PRICE SPOOFING ---
    // Fetch real prices from database
    const productIds = payload.items.map((i: any) => i.productId).filter(Boolean);
    const { data: products } = await adminSupabase
      .from('products')
      .select('id, price_usd, product_variants(id, price)')
      .in('id', productIds);
      
    if (!products) {
      return NextResponse.json({ error: 'Failed to fetch product data' }, { status: 500 });
    }

    const productMap = new Map();
    products.forEach(p => productMap.set(p.id, p));

    let serverSubtotal = 0;
    const validatedItems = payload.items.map((item: any) => {
      const dbProduct = productMap.get(item.productId);
      if (!dbProduct) throw new Error(`Product not found: ${item.productId}`);
      
      let truePrice = Number(dbProduct.price_usd);
      
      if (item.variantId) {
        const dbVariant = dbProduct.product_variants?.find((v: any) => v.id === item.variantId);
        if (dbVariant && dbVariant.price !== null) {
          truePrice = Number(dbVariant.price);
        }
      }
      
      const qty = Math.max(1, Number(item.quantity || 1));
      serverSubtotal += truePrice * qty;
      
      return {
        ...item,
        quantity: qty,
        price: truePrice, // Override client price with true server price
        price_usd: truePrice,
      };
    });

    // Guard against negative delivery fee spoofing
    const rawDeliveryOption = payload.fulfillment_type || payload.delivery_option || 'collection';
    const fulfillment: 'collection' | 'delivery' = rawDeliveryOption === 'delivery' ? 'delivery' : 'collection';
    const deliveryFee = fulfillment === 'collection' ? 0 : Math.max(0, Number(payload.delivery_fee_usd || 0));
    const serverTotal = serverSubtotal + deliveryFee;

    const customerName = (payload.customer_name || payload.shipping_name || payload.name || 'Online Customer').trim();
    const customerPhone = (payload.customer_phone || payload.shipping_phone || payload.phone || '').trim();
    const customerEmail = (payload.customer_email || payload.email || '').trim();
    const deliveryAddress = (payload.delivery_address || payload.address || '').trim();

    // Sanitize payload for pending_orders
    const orderData = {
      order_ref: payload.order_ref,
      items: validatedItems,
      total_usd: serverTotal, // Use server calculated total
      delivery_fee_usd: deliveryFee,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    const { data: newOrder, error } = await adminSupabase.from('pending_orders').insert(orderData).select().single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (newOrder) {
      // Determine which store to assign to (prefer closest store passed from client if valid)
      let targetStoreId = payload.store_id || null;

      if (!targetStoreId) {
        const { data: defaultStore } = await adminSupabase
          .from('stores')
          .select('id')
          .eq('is_active', true)
          .limit(1)
          .maybeSingle();
        targetStoreId = defaultStore?.id || null;
      }

      if (targetStoreId) {
        const { error: bridgeError } = await adminSupabase.from('online_order_bridge').insert({
          webstore_order_id: newOrder.id,
          store_id: targetStoreId,
          fulfillment,
          status: 'pending',
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: customerEmail || (deliveryAddress ? `Address: ${deliveryAddress}` : ''),
          items: newOrder.items || [],
          total: newOrder.total_usd,
        });

        // --- HANDLE CHECKOUT BRIDGING ERROR ---
        if (bridgeError) {
          console.error('Failed to bridge order to POS:', bridgeError);
          await adminSupabase.from('pending_orders').update({ needs_bridge: true }).eq('id', newOrder.id);
        }
      } else {
        // No active store found
        await adminSupabase.from('pending_orders').update({ needs_bridge: true }).eq('id', newOrder.id);
      }
    }

    return NextResponse.json({ success: true, order: newOrder });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
