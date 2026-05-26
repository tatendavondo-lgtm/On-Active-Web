import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    
    // Minimum validation
    if (!payload.order_ref || !payload.items || !payload.total_usd) {
      return NextResponse.json({ error: 'Missing required order fields' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();
    
    // Sanitize payload for pending_orders
    const orderData = {
      order_ref: payload.order_ref,
      items: payload.items,
      total_usd: payload.total_usd,
      delivery_fee_usd: payload.delivery_fee_usd || 0,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    const { data: newOrder, error } = await adminSupabase.from('pending_orders').insert(orderData).select().single();

    if (error) {
       return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (newOrder) {
      // Determine which store to assign to
      // For now assign to default store - update when multi-store is set up
      const { data: defaultStore } = await adminSupabase
        .from('stores')
        .select('id')
        .eq('is_active', true)
        .limit(1)
        .single();

      if (defaultStore) {
        await adminSupabase.from('online_order_bridge').insert({
          webstore_order_id: newOrder.id,
          store_id: defaultStore.id,
          fulfillment: payload.fulfillment_type || payload.fulfillment || 'collection',
          status: 'pending',
          customer_name: payload.customer_name || payload.shipping_name || 'Online Customer',
          customer_phone: payload.customer_phone || payload.shipping_phone || '',
          customer_email: payload.customer_email || payload.email || '',
          items: newOrder.items || [],
          total: newOrder.total_usd || payload.total_usd || 0,
          order_ref: newOrder.order_ref,
        });
      }
    }

    return NextResponse.json({ success: true, order: newOrder });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
