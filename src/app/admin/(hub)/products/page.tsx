import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ProductsManager } from '@/components/admin/products/ProductsManager';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/admin/login');
  }

  const adminSupabase = createAdminClient();
  const { data: profile } = await adminSupabase.from('profiles').select('role').eq('id', user.id).single();

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
