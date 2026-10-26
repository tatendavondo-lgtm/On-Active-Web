import { createClient as createServiceClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const adminClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await adminClient
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'owner') {
    return Response.json({ error: 'Forbidden — owner only' }, { status: 403 });
  }

  const { email, fullName, role, storeId } = await request.json();

  if (!email?.trim() || !fullName?.trim()) {
    return Response.json({ error: 'Email and full name are required' }, { status: 400 });
  }
  
  if (role === 'manager' && !storeId) {
    return Response.json({ error: 'Store ID is required for managers' }, { status: 400 });
  }

  const targetRole = role || 'manager';

  const { data: createdUser, error } = await adminClient.auth.admin.inviteUserByEmail(email.trim(), {
    data: {
      full_name: fullName.trim(),
      role: targetRole,
    }
  });

  if (error) {
    console.error('Invite Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Ensure profile exists with proper role & full_name immediately
  if (createdUser?.user?.id) {
    await adminClient.from('profiles').upsert({
      id: createdUser.user.id,
      full_name: fullName.trim(),
      role: targetRole,
    });
  }
  
  // If role is manager, link them to the store in employees with a unique non-PIN token
  // (Owner can assign a 4-digit POS PIN in POS Staff Management if they also use a register)
  if (targetRole === 'manager' && storeId) {
    const uniquePlaceholderPin = `mgr_${createdUser.user.id.substring(0, 8)}`;
    const { error: employeeError } = await adminClient.from('employees').insert({
      full_name: fullName.trim(),
      role: 'manager',
      email: email.trim(),
      store_id: storeId,
      is_active: true,
      pin: uniquePlaceholderPin,
      pin_hash: 'hub_manager_only',
    });
    
    if (employeeError) {
      console.error('Failed to link manager to store:', employeeError);
    }
  }

  await adminClient.from('audit_logs').insert({
    user_id: user.id,
    user_name: profile?.full_name || 'Owner',
    user_role: profile?.role || 'owner',
    source: 'admin',
    action: 'invite',
    target_type: 'team_member',
    target_id: createdUser.user.id,
    details: { email: email.trim(), role: targetRole, storeId },
  });

  return Response.json({ 
    success: true, 
    directCreated: false 
  });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

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
  const { data: userRecord } = await adminClient.auth.admin.getUserById(profileId);
  const userEmail = userRecord?.user?.email;

  // Deactivate any linked employee record first so foreign keys or email constraints are freed
  if (userEmail) {
    await adminClient.from('employees').update({ 
      is_active: false,
      pin: `del_${profileId.substring(0, 8)}_${Date.now().toString(36)}`,
      email: null,
      phone: null
    }).eq('email', userEmail);
  }

  const { error } = await adminClient.auth.admin.deleteUser(profileId);
  
  if (error) {
    const { error: banError } = await adminClient.auth.admin.updateUserById(profileId, { 
      ban_duration: '876000h'
    });
    
    if (banError) {
      return Response.json({ error: banError.message }, { status: 500 });
    }
    
    await adminClient.from('profiles').update({ 
      full_name: '[REMOVED]',
      role: 'revoked'
    }).eq('id', profileId);
  }

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
