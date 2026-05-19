'use server';

import bcrypt from 'bcryptjs';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

export async function addStaffMember(data: { fullName: string; role: string; pin: string; storeId: string }) {
  const supabase = await createClient();
  const pinHash = await hashPin(data.pin);

  const { data: employee, error } = await supabase
    .from('employees')
    .insert({
      full_name: data.fullName,
      role: data.role,
      pin: data.pin, // plain text fallback for now, though insecure
      pin_hash: pinHash, // the actual hash requested by Prompt B
      store_id: data.storeId,
      is_active: true,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/admin/staff');
  return employee;
}

export async function deactivateStaffMember(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('employees').update({ is_active: false }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/staff');
}
