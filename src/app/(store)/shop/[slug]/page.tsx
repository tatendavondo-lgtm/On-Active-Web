import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ProductView } from "./ProductView";
import type { Metadata } from 'next';
import { getSettings } from "@/lib/settings";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('products').select('name, description').eq('slug', slug).single();
  
  if (!data) return { title: 'Product Not Found' };
  
  return {
    title: `${data.name} | On Active`,
    description: data.description || `Buy ${data.name} from On Active.`,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: product } = await supabase.from('products').select('*').eq('slug', slug).single();

  if (!product || !product.is_active) {
    notFound();
  }

  // Get real-time stock from the branch inventory
  const { data: inventory } = await supabase
    .from('store_inventory')
    .select('quantity')
    .eq('product_id', product.id)
    .single();
    
  if (inventory) {
    product.stock_quantity = inventory.quantity;
  }
  
  const settings = await getSettings();

  return (
    <main className="flex min-h-screen flex-col bg-[#0A0A0A]">
      <Navbar />
      <div className="flex-1 w-full mt-14 sm:mt-20">
        <ProductView product={product} zigRate={settings.zig_rate} />
      </div>
      <Footer />
    </main>
  );
}
