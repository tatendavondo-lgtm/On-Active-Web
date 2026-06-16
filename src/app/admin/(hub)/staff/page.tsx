import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { TeamManagement } from '@/components/admin/settings/TeamManagement';
import { EmployeeManagement } from '@/components/admin/settings/EmployeeManagement';

export const dynamic = 'force-dynamic';

export default async function StaffPage() {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login');

  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // Redirect only if absolutely no access
  if (!profile) {
    console.error('No profile found for user:', user.id);
    redirect('/admin/dashboard?error=no_profile');
  }

  // Debug role check
  const allowedRoles = ['owner', 'manager', 'admin'];
  if (!allowedRoles.includes(profile.role?.toLowerCase())) {
     console.warn(`User ${user.id} has insufficient role: ${profile.role}`);
     redirect('/admin/dashboard?error=insufficient_role');
  }

  const { data: managers } = await adminSupabase.from('profiles').select('*').order('created_at');
  const { data: stores } = await adminSupabase.from('stores').select('id, name').eq('is_active', true);
  const { data: employees } = await adminSupabase.from('employees').select('*').order('created_at');

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-white font-bold text-xl tracking-tight uppercase">Staff Management</h2>
        <p className="text-[#444] text-xs mt-0.5 uppercase tracking-wider">Configure store cashier POS logins and hub manager roles</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Cashier/POS Management - Visible & manageable by both owners and managers */}
        <div>
          <EmployeeManagement 
            initialEmployees={employees ?? []} 
            stores={stores ?? []} 
          />
        </div>

        {/* Manager Profiles - Visible by both, but only editable if owner (TeamManagement component handles roles check for deletions) */}
        <div>
          <TeamManagement managers={managers ?? []} stores={stores ?? []} />
        </div>
      </div>
    </div>
  );
}
