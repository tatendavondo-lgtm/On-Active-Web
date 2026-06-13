import { NextResponse } from 'next/server';
import { addStaffMember } from '@/app/admin/(hub)/staff/actions';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  try {
    const adminSupabase = createAdminClient();
    const { data: stores } = await adminSupabase.from('stores').select('id').limit(1);
    const storeId = stores?.[0]?.id || '';

    const result = await addStaffMember({
      fullName: 'Test API',
      role: 'till_operator',
      pin: '5555',
      storeId: storeId,
    });

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, stack: error.stack }, { status: 500 });
  }
}
