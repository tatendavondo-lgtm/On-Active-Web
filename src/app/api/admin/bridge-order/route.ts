import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/admin/bridge-order
 * Bridges a confirmed webstore order to the online_order_bridge table
 * so the POS system can see and fulfill it.
 *
 * Body: { orderId: string, storeId: string, fulfillment: 'collection' | 'delivery' }
 */
export async function POST(req: NextRequest) {
  try {
    const { orderId, storeId, fulfillment } = await req.json();

    if (!orderId || !storeId) {
      return NextResponse.json(
        { error: 'Missing orderId or storeId' },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();

    // Verify the order exists and is confirmed
    const { data: order, error: orderError } = await adminSupabase
      .from('pending_orders')
      .select('id, status, order_ref, items, total_usd')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Insert into online_order_bridge
    const { error: bridgeError } = await adminSupabase
      .from('online_order_bridge')
      .insert({
        webstore_order_id: orderId,
        store_id: storeId,
        fulfillment: fulfillment || 'collection',
        status: 'pending',
        customer_name: 'Online Customer',
        items: order.items || [],
        total: order.total_usd || 0,
        order_ref: order.order_ref,
        assigned_at: new Date().toISOString(),
      });

    if (bridgeError) {
      // If it's a duplicate, that's fine — order was already bridged
      if (bridgeError.code === '23505') {
        return NextResponse.json({ success: true, message: 'Order already bridged' });
      }
      return NextResponse.json(
        { error: bridgeError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
