import { createClient } from '@/lib/supabase/server';
import { OrderFilters } from '@/components/admin/orders/OrderFilters';
import { OrdersTableWrapper } from '@/components/admin/orders/OrdersTableWrapper';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from('profiles').select('role').eq('id', user.id).single()
    : { data: null };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-xl tracking-tight">Orders</h2>
          <p className="text-[#444] text-sm mt-0.5">All orders from the storefront</p>
        </div>
      </div>
      <OrdersTableWrapper userRole={profile?.role ?? 'manager'} />
    </div>
  );
}
