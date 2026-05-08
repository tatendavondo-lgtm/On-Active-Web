import { createClient as createServiceClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  // Verify the caller is an owner
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'owner') {
    return Response.json({ error: 'Forbidden â€” owner only' }, { status: 403 });
  }

  const { email } = await request.json();
  if (!email) return Response.json({ error: 'Email required' }, { status: 400 });

  // Use service role client to send the invite
  const adminClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await adminClient.auth.admin.inviteUserByEmail(email);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ success: true });
}
