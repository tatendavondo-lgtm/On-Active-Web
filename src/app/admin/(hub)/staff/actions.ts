'use server';

import bcrypt from 'bcryptjs';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function logAction(action: string, targetType: string, targetId: string, details: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from('admin_audit_logs').insert({
      admin_id: user.id,
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
  const supabase = await createClient();
  const pinHash = await hashPin(data.pin);

  const { data: employee, error } = await supabase
    .from('employees')
    .insert({
      full_name: data.fullName,
      role: data.role,
      pin: data.pin,
      pin_hash: pinHash,
      store_id: data.storeId,
      email: data.email,
      phone: data.phone,
      is_active: true,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await logAction('create', 'employee', employee.id, { name: data.fullName, role: data.role });
  
  revalidatePath('/admin/staff');
  return employee;
}

export async function updateStaffMember(id: string, data: { fullName: string; role: string; pin?: string; storeId: string; email?: string; phone?: string }) {
  const supabase = await createClient();
  const updates: any = {
    full_name: data.fullName,
    role: data.role,
    store_id: data.storeId,
    email: data.email,
    phone: data.phone,
  };

  if (data.pin) {
    updates.pin = data.pin;
    updates.pin_hash = await hashPin(data.pin);
  }

  const { data: employee, error } = await supabase
    .from('employees')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  await logAction('update', 'employee', id, { name: data.fullName, role: data.role, pinChanged: !!data.pin });

  revalidatePath('/admin/staff');
  return employee;
}

export async function deactivateStaffMember(id: string) {
  const supabase = await createClient();
  const { data: employee } = await supabase.from('employees').select('full_name').eq('id', id).single();
  
  const { error } = await supabase.from('employees').update({ is_active: false }).eq('id', id);
  if (error) throw new Error(error.message);

  await logAction('deactivate', 'employee', id, { name: employee?.full_name });

  revalidatePath('/admin/staff');
}

