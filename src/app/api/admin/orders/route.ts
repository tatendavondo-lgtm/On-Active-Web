import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getLiveZigRate } from '@/lib/exchangeRates';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminSupabase = createAdminClient();

    const [webRes, bridgeRes, posRes, zigRate] = await Promise.all([
      adminSupabase.from('pending_orders').select('*').order('created_at', { ascending: false }).limit(150),
      adminSupabase.from('online_order_bridge').select('webstore_order_id, customer_name, customer_phone, customer_email, fulfillment, status'),
      adminSupabase.from('pos_orders').select(`
        id, order_number, source, status, total, created_at,
        payment_method, currency, amount_paid, exchange_rate, auto_discount_applied, auto_discount_amount,
        employee:employees!pos_orders_employee_id_fkey(full_name),
        salesman:employees!pos_orders_salesman_id_fkey(full_name)
      `).order('created_at', { ascending: false }).limit(150),
      getLiveZigRate()
    ]);

    if (webRes.error) console.error("Web orders error:", webRes.error);
    if (posRes.error) console.error("POS orders error:", posRes.error);

    const bridgeMap = new Map();
    (bridgeRes.data || []).forEach((b: any) => bridgeMap.set(b.webstore_order_id, b));

    const enrichedWebOrders = (webRes.data || []).map((w: any) => {
      const bridge = bridgeMap.get(w.id);
      return {
        ...w,
        customer_name: bridge?.customer_name || w.customer_name || null,
        customer_phone: bridge?.customer_phone || w.customer_phone || null,
        customer_email: bridge?.customer_email || w.customer_email || null,
        fulfillment: bridge?.fulfillment || w.fulfillment || null,
      };
    });

    return NextResponse.json({
      webOrders: enrichedWebOrders,
      posOrders: posRes.data || [],
      zigRate
    });

  } catch (error: any) {
    console.error("Orders API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

