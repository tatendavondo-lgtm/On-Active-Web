import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminSupabase = createAdminClient();

    const [webRes, posRes, settingsRes] = await Promise.all([
      adminSupabase.from('pending_orders').select('*').order('created_at', { ascending: false }).limit(150),
      adminSupabase.from('pos_orders').select(`
        id, order_number, source, status, total, created_at,
        payment_method, currency, amount_paid, exchange_rate, auto_discount_applied, auto_discount_amount,
        employee:employees!pos_orders_employee_id_fkey(full_name),
        salesman:employees!pos_orders_salesman_id_fkey(full_name)
      `).order('created_at', { ascending: false }).limit(150),
      adminSupabase.from('settings').select('key, value').eq('key', 'zig_rate').single()
    ]);

    if (webRes.error) console.error("Web orders error:", webRes.error);
    if (posRes.error) console.error("POS orders error:", posRes.error);

    return NextResponse.json({
      webOrders: webRes.data || [],
      posOrders: posRes.data || [],
      zigRate: settingsRes.data ? Number(settingsRes.data.value) : 13.5
    });

  } catch (error: any) {
    console.error("Orders API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
