import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { StoreSettings } from '@/components/admin/settings/StoreSettings';
import { TeamManagement } from '@/components/admin/settings/TeamManagement';
import { EmployeeManagement } from '@/components/admin/settings/EmployeeManagement';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // Owner only
  if (profile?.role !== 'owner') redirect('/admin/dashboard');

  const { data: settings } = await supabase.from('settings').select('key, value');
  const { data: managers } = await supabase.from('profiles').select('*').order('created_at');
  const { data: stores } = await supabase.from('stores').select('id, name').eq('is_active', true);
  const { data: employees } = await supabase.from('employees').select('*').order('created_at');

  const settingsMap: Record<string, string> = {};
  for (const s of settings ?? []) settingsMap[s.key] = s.value;

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h2 className="text-white font-bold text-xl tracking-tight">Settings</h2>
        <p className="text-[#444] text-sm mt-0.5">Store configuration and team management</p>
      </div>
      <StoreSettings initialSettings={settingsMap} />
      <TeamManagement managers={managers ?? []} />
      <EmployeeManagement 
        initialEmployees={employees ?? []} 
        stores={stores ?? []} 
      />
    </div>
  );
}
