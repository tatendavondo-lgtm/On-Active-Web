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
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'owner') {
    return Response.json({ error: 'Forbidden — owner only' }, { status: 403 });
  }

  const { email, fullName, role, storeId } = await request.json();

  if (!email || !fullName) {
    return Response.json({ error: 'Email and full name are required' }, { status: 400 });
  }
  
  if (role === 'manager' && !storeId) {
    return Response.json({ error: 'Store ID is required for managers' }, { status: 400 });
  }

  // Send an official email invitation via Supabase
  const { data: createdUser, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: {
      full_name: fullName,
      role: role || 'manager',
    }
  });

  if (error) {
    console.error('Invite Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
  
  // If role is manager, create an employee profile so they are linked to the store
  if (role === 'manager' && storeId) {
    const { error: employeeError } = await adminClient.from('employees').insert({
      full_name: fullName,
      role: 'manager',
      email: email,
      store_id: storeId,
      is_active: true,
      pin: '0000', // A placeholder PIN just to satisfy the schema, managers mostly use the hub via email
      pin_hash: 'placeholder'
    });
    
    if (employeeError) {
      console.error('Failed to link manager to store:', employeeError);
      // We don't fail the request here, but we log it
    }
  }

  // Log action
  await adminClient.from('audit_logs').insert({
    user_id: user.id,
    user_name: profile?.full_name || 'Owner',
    user_role: profile?.role || 'owner',
    source: 'admin',
    action: 'invite',
    target_type: 'team_member',
    target_id: createdUser.user.id,
    details: { email, role, storeId },
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
  
  // Actually try to delete the user from auth.users. This will cascade to profiles.
  const { error } = await adminClient.auth.admin.deleteUser(profileId);
  
  if (error) {
    // If deletion fails (likely due to foreign key constraints in audit_logs),
    // we fallback to banning the user and renaming them to hide them from the UI.
    const { error: banError } = await adminClient.auth.admin.updateUserById(profileId, { 
      ban_duration: '876000h' // 100 years
    });
    
    if (banError) {
      return Response.json({ error: banError.message }, { status: 500 });
    }
    
    // Rename them so the frontend knows to filter them out
    await adminClient.from('profiles').update({ 
      full_name: '[REMOVED]' 
    }).eq('id', profileId);

    // Get their email to deactivate their employee record
    const { data: userRecord } = await adminClient.auth.admin.getUserById(profileId);
    if (userRecord?.user?.email) {
      await adminClient.from('employees').update({ 
        is_active: false,
        pin: `del_${profileId.substring(0, 8)}`,
        email: null,
        phone: null
      }).eq('email', userRecord.user.email);
    }
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
