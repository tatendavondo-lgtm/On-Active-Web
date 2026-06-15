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
