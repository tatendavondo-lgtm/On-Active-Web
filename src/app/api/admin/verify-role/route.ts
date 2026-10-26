import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    // 1. Verify standard session via cookies (secure)
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch role using privileged client (bypass RLS)
    const adminSupabase = createAdminClient();
    let { data: profile } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Auto-provision profile if missing:
    // - If user_metadata has a role (from admin invite), use it
    // - Or if the profiles table has 0 owners yet, bootstrap the first authenticated user as 'owner'
    if (!profile) {
      const metaRole = user.user_metadata?.role;
      const { count: ownerCount } = await adminSupabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'owner');

      const assignedRole = metaRole || ((ownerCount ?? 0) === 0 ? 'owner' : null);

      if (assignedRole) {
        const { data: createdProfile } = await adminSupabase
          .from('profiles')
          .upsert({
            id: user.id,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Owner',
            role: assignedRole,
          })
          .select('*')
          .single();

        profile = createdProfile;
      }
    }

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Role verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
