'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

async function logAction(action: string, targetType: string, targetId: string, details: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const adminSupabase = createAdminClient();
    
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single();

    await adminSupabase.from('audit_logs').insert({
      user_id: user.id,
      user_name: profile?.full_name || 'Admin',
      user_role: profile?.role || 'admin',
      source: 'admin',
      action,
      target_type: targetType,
      target_id: targetId,
      details,
    });
  }
}

async function verifyOwner() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const adminSupabase = createAdminClient();
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'owner') {
    throw new Error('Forbidden — Owner only action');
  }
}

export async function addStore(data: {
  name: string;
  code: string;
  address: string;
  latitude: number;
  longitude: number;
  geofenceRadiusMeters: number;
  phone?: string;
  timezone?: string;
}) {
  await verifyOwner();
  const adminSupabase = createAdminClient();

  const { data: store, error } = await adminSupabase
    .from('stores')
    .insert({
      name: data.name,
      code: data.code.toUpperCase(),
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
      geofence_radius_meters: data.geofenceRadiusMeters,
      phone: data.phone || null,
      timezone: data.timezone || 'Africa/Harare',
      is_active: true,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await logAction('create', 'store', store.id, { name: data.name, code: data.code });
  
  revalidatePath('/admin/settings');
  return store;
}

export async function updateStore(
  id: string,
  data: {
    name: string;
    code: string;
    address: string;
    latitude: number;
    longitude: number;
    geofenceRadiusMeters: number;
    phone?: string;
    timezone?: string;
  }
) {
  await verifyOwner();
  const adminSupabase = createAdminClient();

  const { data: store, error } = await adminSupabase
    .from('stores')
    .update({
      name: data.name,
      code: data.code.toUpperCase(),
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
      geofence_radius_meters: data.geofenceRadiusMeters,
      phone: data.phone || null,
      timezone: data.timezone || 'Africa/Harare',
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  await logAction('update', 'store', id, { name: data.name, code: data.code });

  revalidatePath('/admin/settings');
  return store;
}

export async function toggleStoreStatus(id: string, isActive: boolean) {
  await verifyOwner();
  const adminSupabase = createAdminClient();

  const { data: store, error } = await adminSupabase
    .from('stores')
    .update({ is_active: isActive })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  await logAction(isActive ? 'activate' : 'deactivate', 'store', id, { name: store.name });

  revalidatePath('/admin/settings');
  return store;
}

export async function updateStoreSettings(settings: Record<string, string>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const adminSupabase = createAdminClient();
  const { data: profile } = await adminSupabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'owner' && profile?.role !== 'admin') {
    throw new Error('Forbidden — Admin or Owner only');
  }

  const updates = Object.entries(settings).map(([key, value]) => ({
    key,
    value,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await adminSupabase
    .from('settings')
    .upsert(updates, { onConflict: 'key' });

  if (error) throw new Error(error.message);

  await logAction('update', 'settings', 'global', { keys: Object.keys(settings) });
  revalidatePath('/admin/settings');
}
