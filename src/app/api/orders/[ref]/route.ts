import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { getSettings } from '@/lib/settings';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ref: string }> }
) {
  try {
    const { ref } = await params;
    if (!ref) {
      return NextResponse.json({ error: 'Missing order reference' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();
    const { data: order, error } = await adminSupabase
      .from('pending_orders')
      .select('id, order_ref, items, total_usd, delivery_fee_usd, status, created_at')
      .eq('order_ref', ref)
      .maybeSingle();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const { data: bridge } = await adminSupabase
      .from('online_order_bridge')
      .select('fulfillment, status, customer_name')
      .eq('webstore_order_id', order.id)
      .maybeSingle();

    const settings = await getSettings();

    return NextResponse.json({
      order: {
        order_ref: order.order_ref,
        status: bridge?.status || order.status,
        fulfillment: bridge?.fulfillment || 'collection',
        customer_name: bridge?.customer_name || null,
        items: order.items || [],
        total_usd: Number(order.total_usd || 0),
        delivery_fee_usd: Number(order.delivery_fee_usd || 0),
        created_at: order.created_at,
        whatsapp_number: settings?.whatsapp_number || '+263782836513',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
