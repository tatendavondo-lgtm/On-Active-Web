import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getCombinedMetrics } from '@/lib/admin/getCombinedMetrics';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 1. Verify standard session via cookies (secure)
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch role using privileged client (bypass RLS)
    const adminSupabase = createAdminClient();
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    let storeIdFilter: string | undefined = undefined;

    // If manager, restrict to their assigned store_id
    if (profile.role === 'manager') {
      const { data: employee } = await adminSupabase
        .from('employees')
        .select('store_id')
        .eq('email', user.email)
        .single();
      
      storeIdFilter = employee?.store_id || undefined;
      if (!storeIdFilter) {
        // Fallback to first store to avoid crashing if employee is not linked
        const { data: fallbackStore } = await adminSupabase.from('stores').select('id').limit(1).single();
        storeIdFilter = fallbackStore?.id || undefined;
      }
    }

    const metrics = await getCombinedMetrics(storeIdFilter);
    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Metrics API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
