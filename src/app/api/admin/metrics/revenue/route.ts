import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const adminSupabase = createAdminClient();
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['owner', 'manager', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get('year');
    const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();

    // Start and end of the requested year
    const startOfYear = new Date(year, 0, 1).toISOString();
    const endOfYear = new Date(year, 11, 31, 23, 59, 59).toISOString();

    const [
      { data: confirmedOnlineOrders },
      { data: posOrders },
      { data: pipelineSalesmanOrders }
    ] = await Promise.all([
      // Only confirmed webstore orders (excludes unpaid 'pending' or 'cancelled')
      adminSupabase
        .from('pending_orders')
        .select('created_at, total_usd')
        .gte('created_at', startOfYear)
        .lte('created_at', endOfYear)
        .eq('status', 'confirmed'),
      // Completed POS orders (excludes 'online' source if already counted in confirmedOnlineOrders, or we separate them cleanly)
      adminSupabase
        .from('pos_orders')
        .select('created_at, total, source')
        .gte('created_at', startOfYear)
        .lte('created_at', endOfYear)
        .eq('status', 'completed'),
      // Active salesman pipeline orders not yet completed in pos_orders
      adminSupabase
        .from('salesman_orders')
        .select('created_at, subtotal, status')
        .gte('created_at', startOfYear)
        .lte('created_at', endOfYear)
        .not('status', 'in', '("completed","cancelled")')
    ]);

    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      monthIndex: i,
      label: new Date(year, i, 1).toLocaleDateString('en-GB', { month: 'short' }),
      revenue: 0,
    }));

    const addRevenue = (dateStr: string, amount: number) => {
      const d = new Date(dateStr);
      const m = d.getMonth();
      if (m >= 0 && m < 12) {
        monthlyData[m].revenue += Number(amount || 0);
      }
    };

    // Add confirmed webstore orders
    for (const order of confirmedOnlineOrders ?? []) {
      addRevenue(order.created_at, order.total_usd ?? 0);
    }
    // Add completed POS orders (excluding source === 'online' to avoid double counting confirmed webstore orders)
    for (const order of posOrders ?? []) {
      if (order.source !== 'online') {
        addRevenue(order.created_at, order.total ?? 0);
      }
    }
    // Add active salesman pipeline orders not yet completed at POS
    for (const order of pipelineSalesmanOrders ?? []) {
      addRevenue(order.created_at, order.subtotal ?? 0);
    }

    return NextResponse.json({ data: monthlyData });
  } catch (err: any) {
    console.error('Yearly Revenue API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
