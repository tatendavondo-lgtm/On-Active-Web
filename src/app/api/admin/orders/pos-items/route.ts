import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    const { data, error } = await adminSupabase
      .from('pos_order_items')
      .select('id, product_id, product_name, quantity, price_usd')
      .eq('order_id', orderId);

    if (error) {
      console.error("POS items error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ items: data || [] });

  } catch (error: any) {
    console.error("POS items API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
