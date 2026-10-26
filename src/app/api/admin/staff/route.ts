import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import bcrypt from 'bcryptjs';

async function logAction(userId: string, action: string, targetType: string, targetId: string, details: any) {
  try {
    const adminSupabase = createAdminClient();
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', userId)
      .single();

    await adminSupabase.from('audit_logs').insert({
      user_id: userId,
      user_name: profile?.full_name || 'Admin',
      user_role: profile?.role || 'admin',
      source: 'admin',
      action,
      target_type: targetType,
      target_id: targetId,
      details,
    });
  } catch (e) {
    console.error('logAction failed:', e);
  }
}

async function verifyAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const adminSupabase = createAdminClient();
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const allowed = ['owner', 'manager', 'admin'];
  if (!profile || !allowed.includes(profile.role?.toLowerCase())) return null;

  return user;
}

// POST = Add staff member
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const user = await verifyAdmin(supabase);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fullName, role, pin, storeId, email, phone } = body;

    if (!fullName?.trim() || !role || !pin || !storeId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!/^\d{4}$/.test(String(pin).trim())) {
      return NextResponse.json({ error: 'PIN must be exactly 4 digits' }, { status: 400 });
    }

    const cleanPin = String(pin).trim();
    const pinHash = await bcrypt.hash(cleanPin, 10);
    const adminSupabase = createAdminClient();

    const { data: employee, error } = await adminSupabase
      .from('employees')
      .insert({
        full_name: fullName.trim(),
        role,
        pin: cleanPin,
        pin_hash: pinHash,
        store_id: storeId,
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        is_active: true,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A staff member already exists with this email, phone, or 4-digit PIN.' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logAction(user.id, 'create', 'employee', employee.id, { name: fullName.trim(), role });

    return NextResponse.json(employee);
  } catch (err: any) {
    console.error('POST /api/admin/staff error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// PUT = Update staff member
export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const user = await verifyAdmin(supabase);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, fullName, role, pin, storeId, email, phone } = body;

    if (!id || !fullName?.trim() || !role || !storeId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();
    const updates: any = {
      full_name: fullName.trim(),
      role,
      store_id: storeId,
      email: email?.trim() || null,
      phone: phone?.trim() || null,
    };

    if (pin !== undefined && String(pin).trim() !== '') {
      const cleanPin = String(pin).trim();
      if (!/^\d{4}$/.test(cleanPin)) {
        return NextResponse.json({ error: 'New PIN must be exactly 4 digits' }, { status: 400 });
      }
      updates.pin = cleanPin;
      updates.pin_hash = await bcrypt.hash(cleanPin, 10);
    }

    const { data: employee, error } = await adminSupabase
      .from('employees')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A staff member already exists with this email, phone, or 4-digit PIN.' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logAction(user.id, 'update', 'employee', id, { name: fullName.trim(), role, pinChanged: !!pin });

    return NextResponse.json(employee);
  } catch (err: any) {
    console.error('PUT /api/admin/staff error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE = Deactivate staff member
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const user = await verifyAdmin(supabase);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing employee id' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    const { data: emp } = await adminSupabase.from('employees').select('full_name').eq('id', id).single();

    const { error } = await adminSupabase
      .from('employees')
      .update({
        is_active: false,
        pin: `del_${id.substring(0, 8)}_${Date.now().toString(36)}`,
        email: null,
        phone: null,
      })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await logAction(user.id, 'deactivate', 'employee', id, { name: emp?.full_name });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('DELETE /api/admin/staff error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
