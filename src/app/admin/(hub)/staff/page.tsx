import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TeamManagement } from '@/components/admin/settings/TeamManagement';
import { EmployeeManagement } from '@/components/admin/settings/EmployeeManagement';

export const dynamic = 'force-dynamic';

export default async function StaffPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // Allow both Owner and Manager roles
  if (!profile || !['owner', 'manager'].includes(profile.role)) {
    redirect('/admin/dashboard');
  }

  const { data: managers } = await supabase.from('profiles').select('*').order('created_at');
  const { data: stores } = await supabase.from('stores').select('id, name').eq('is_active', true);
  const { data: employees } = await supabase.from('employees').select('*').order('created_at');

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
          <TeamManagement managers={managers ?? []} />
        </div>
      </div>
    </div>
  );
}
