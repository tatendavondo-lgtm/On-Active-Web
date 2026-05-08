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
    
    const { error } = await adminSupabase.from('pending_orders').insert({
      ...payload,
      created_at: new Date().toISOString(),
      status: 'pending' // Force pending status on creation
    });

    if (error) {
       return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
