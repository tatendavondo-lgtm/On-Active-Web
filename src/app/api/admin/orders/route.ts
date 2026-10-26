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

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminSupabase = createAdminClient();
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single();

    if (!profile || !['owner', 'manager', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { orderId, status } = await req.json();
    if (!orderId || !['pending', 'confirmed', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Invalid orderId or status' }, { status: 400 });
    }

    const { error } = await adminSupabase
      .from('pending_orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Also keep online_order_bridge status synchronized
    await adminSupabase
      .from('online_order_bridge')
      .update({ status })
      .eq('webstore_order_id', orderId);

    // Record in audit_logs
    await adminSupabase.from('audit_logs').insert({
      user_id: user.id,
      user_name: profile.full_name || 'Admin',
      user_role: profile.role,
      source: 'admin',
      action: status === 'confirmed' ? 'confirm_order' : `order_${status}`,
      target_type: 'order',
      target_id: orderId,
      details: { status },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Orders PATCH Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
