import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import bcrypt from 'bcryptjs';

export async function GET(request: Request) {
  try {
    const adminSupabase = createAdminClient();
    
    // Test bcrypt
    const pinHash = await bcrypt.hash('8888', 10);
    
    // Fetch a store to use
    const { data: stores } = await adminSupabase.from('stores').select('id').limit(1);
    const storeId = stores?.[0]?.id;

    if (!storeId) {
      return NextResponse.json({ error: 'No stores found' }, { status: 400 });
    }

    // Try to insert a staff member
    const { data: employee, error } = await adminSupabase
      .from('employees')
      .insert({
        full_name: 'Test API Endpoint',
        role: 'salesman',
        pin: '8888',
        pin_hash: pinHash,
        store_id: storeId,
        email: 'testapi@gmail.com',
        phone: '99999999',
        is_active: true,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message, details: error }, { status: 400 });
    }

    return NextResponse.json({ success: true, employee });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
}
