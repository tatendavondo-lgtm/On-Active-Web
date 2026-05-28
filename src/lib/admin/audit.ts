import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function logAuditAction({
  action,
  targetType,
  targetId,
  details = {},
  source = 'admin'
}: {
  action: string;
  targetType: string;
  targetId?: string;
  details?: any;
  source?: 'admin' | 'pos';
}) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch user details for the log
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single();

    await adminSupabase.from('audit_logs').insert({
      user_id: user.id,
      user_name: profile?.full_name || 'System',
      user_role: profile?.role || 'admin',
      source,
      action,
      target_type: targetType,
      target_id: targetId,
      details,
    });
  } catch (err) {
    console.error('Audit logging failed:', err);
  }
}
