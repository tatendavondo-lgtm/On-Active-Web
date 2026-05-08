import { createClient } from '@/lib/supabase/server';
import { ProductsManager } from '@/components/admin/products/ProductsManager';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from('profiles').select('role').eq('id', user.id).single()
    : { data: null };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-xl tracking-tight">Products</h2>
          <p className="text-[#444] text-sm mt-0.5">Manage your product catalogue</p>
        </div>
      </div>
      <ProductsManager userRole={profile?.role ?? 'manager'} />
    </div>
  );
}
