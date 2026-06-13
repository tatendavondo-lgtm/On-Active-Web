'use server';

import bcrypt from 'bcryptjs';
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

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

export async function addStaffMember(data: { fullName: string; role: string; pin: string; storeId: string; email?: string; phone?: string }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const adminSupabase = createAdminClient();
    
    // Secure role check on the server (bypassing RLS)
    const { data: callerProfile } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const allowedRoles = ['owner', 'manager', 'admin'];
    if (!callerProfile || !allowedRoles.includes(callerProfile.role?.toLowerCase())) {
      throw new Error('Forbidden — insufficient permissions');
    }

    const pinHash = await hashPin(data.pin);

    const { data: employee, error } = await adminSupabase
      .from('employees')
      .insert({
        full_name: data.fullName,
        role: data.role,
        pin: data.pin,
        pin_hash: pinHash,
        store_id: data.storeId,
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        is_active: true,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return { error: 'A staff member already exists with this email, phone, or PIN.' };
      return { error: error.message };
    }

    await logAction('create', 'employee', employee.id, { name: data.fullName, role: data.role });
    return employee;
  } catch (err: any) {
    console.error('addStaffMember error:', err);
    return { error: err.message || 'Internal Server Error' };
  }
}

export async function updateStaffMember(id: string, data: { fullName: string; role: string; pin?: string; storeId: string; email?: string; phone?: string }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const adminSupabase = createAdminClient();

    // Secure role check on the server (bypassing RLS)
    const { data: callerProfile } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const allowedRoles = ['owner', 'manager', 'admin'];
    if (!callerProfile || !allowedRoles.includes(callerProfile.role?.toLowerCase())) {
      throw new Error('Forbidden — insufficient permissions');
    }

    const updates: any = {
      full_name: data.fullName,
      role: data.role,
      store_id: data.storeId,
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
    };

    if (data.pin) {
      updates.pin = data.pin;
      updates.pin_hash = await hashPin(data.pin);
    }

    const { data: employee, error } = await adminSupabase
      .from('employees')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return { error: 'A staff member already exists with this email, phone, or PIN.' };
      return { error: error.message };
    }

    await logAction('update', 'employee', id, { name: data.fullName, role: data.role, pinChanged: !!data.pin });
    return employee;
  } catch (err: any) {
    console.error('updateStaffMember error:', err);
    return { error: err.message || 'Internal Server Error' };
  }
}

export async function deactivateStaffMember(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const adminSupabase = createAdminClient();

  // Secure role check on the server (bypassing RLS)
  const { data: callerProfile } = await adminSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const allowedRoles = ['owner', 'manager', 'admin'];
  if (!callerProfile || !allowedRoles.includes(callerProfile.role?.toLowerCase())) {
    throw new Error('Forbidden — insufficient permissions');
  }

  const { data: employee } = await adminSupabase.from('employees').select('full_name').eq('id', id).single();
  
  const { error } = await adminSupabase.from('employees').update({ is_active: false }).eq('id', id);
  if (error) throw new Error(error.message);

  await logAction('deactivate', 'employee', id, { name: employee?.full_name });

  revalidatePath('/admin/staff');
  revalidatePath('/admin/settings');
}

export async function removeTeamMember(profileId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const adminSupabase = createAdminClient();

  // Verify the caller is an owner (bypassing RLS)
  const { data: callerProfile } = await adminSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (callerProfile?.role !== 'owner') {
    throw new Error('Forbidden — owner only');
  }

  // Use the admin service client to bypass RLS and soft-delete the profile
  const { data: targetProfile } = await adminSupabase.from('profiles').select('full_name').eq('id', profileId).single();
  
  const { error } = await adminSupabase.from('profiles').update({ role: 'revoked' }).eq('id', profileId);
  if (error) throw new Error(error.message);

  await logAction('remove', 'team_member', profileId, { name: targetProfile?.full_name || profileId });

  revalidatePath('/admin/staff');
  revalidatePath('/admin/settings');
}

