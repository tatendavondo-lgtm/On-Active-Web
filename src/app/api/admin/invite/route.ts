import { createClient as createServiceClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  // Verify the caller is an owner
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  // Use service role client to verify caller and send the invite
  const adminClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'owner') {
    return Response.json({ error: 'Forbidden — owner only' }, { status: 403 });
  }

  const { email, fullName, role } = await request.json();
  if (!email) return Response.json({ error: 'Email required' }, { status: 400 });

  // Send an official email invitation via Supabase
  const { data: createdUser, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: {
      full_name: fullName || 'New Manager',
      role: role || 'manager',
    }
  });

  if (error) {
    if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('already exists')) {
      return Response.json({ error: 'A user with this email already exists.' }, { status: 400 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ 
    success: true, 
    directCreated: false 
  });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  // Use service role client to verify caller and delete user
  const adminClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: callerProfile } = await adminClient
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  if (callerProfile?.role !== 'owner') {
    return Response.json({ error: 'Forbidden — owner only' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const profileId = searchParams.get('id');

  if (!profileId) {
    return Response.json({ error: 'Profile ID is required' }, { status: 400 });
  }

  const { data: targetProfile } = await adminClient.from('profiles').select('full_name').eq('id', profileId).single();
  
  // Actually delete the user from auth.users. This will cascade to profiles.
  const { error } = await adminClient.auth.admin.deleteUser(profileId);
  
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Log action
  await adminClient.from('audit_logs').insert({
    user_id: user.id,
    user_name: callerProfile?.full_name || 'Owner',
    user_role: callerProfile?.role || 'owner',
    source: 'admin',
    action: 'remove',
    target_type: 'team_member',
    target_id: profileId,
    details: { name: targetProfile?.full_name || profileId },
  });

  return Response.json({ success: true });
}
