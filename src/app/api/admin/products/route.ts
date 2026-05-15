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

    const { data: result, error } = payload.id
      ? await adminSupabase.from('products').update(payload).eq('id', payload.id).select().single()
      : await adminSupabase.from('products').insert(payload).select().single();

    if (error) {
       console.error('Database error in products API:', error);
       return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // If new product, initialize Harare store inventory
    if (!payload.id && result) {
      await adminSupabase.from('store_inventory').insert({
        store_id: '00000000-0000-0000-0000-000000000001',
        product_id: result.id,
        quantity: payload.stock_quantity || 0
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Server error in products API:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
