import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { StoreSettings } from '@/components/admin/settings/StoreSettings';
import { BranchManagement } from '@/components/admin/settings/BranchManagement';
import { TeamManagement } from '@/components/admin/settings/TeamManagement';
import { EmployeeManagement } from '@/components/admin/settings/EmployeeManagement';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login');

  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // Owner only
  if (profile?.role !== 'owner') redirect('/admin/dashboard');

  const { data: settings } = await adminSupabase.from('settings').select('key, value');
  const { data: managers } = await adminSupabase.from('profiles').select('*').order('created_at');
  const { data: allStores } = await adminSupabase.from('stores').select('*').order('created_at');
  const { data: employees } = await adminSupabase.from('employees').select('*').order('created_at');

  const settingsMap: Record<string, string> = {};
  for (const s of settings ?? []) settingsMap[s.key] = s.value;

  const activeStores = allStores?.filter(s => s.is_active).map(s => ({ id: s.id, name: s.name })) ?? [];

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h2 className="text-white font-bold text-xl tracking-tight">Settings</h2>
        <p className="text-[#444] text-sm mt-0.5">Store configuration and team management</p>
      </div>
      <StoreSettings initialSettings={settingsMap} />
      <BranchManagement initialStores={allStores ?? []} />
      <TeamManagement managers={managers ?? []} />
      <EmployeeManagement 
        initialEmployees={employees ?? []} 
        stores={activeStores} 
      />
    </div>
  );
}
