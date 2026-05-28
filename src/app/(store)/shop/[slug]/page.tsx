import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ProductView } from "./ProductView";
import type { Metadata } from 'next';
import { getSettings } from "@/lib/settings";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
    const { slug } = await params;
    const supabase = await createClient();
    const { data } = await supabase.from('products').select('name, description').eq('slug', slug).single();
    
    if (!data) return { title: 'Product Not Found' };
    
    return {
      title: `${data.name} | On Active`,
      description: data.description || `Buy ${data.name} from On Active.`,
    };
  } catch (err) {
    return { title: 'On Active Wear' };
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  
  // 1. Fetch Product
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single();

  if (productError || !product || !product.is_active) {
    notFound();
  }

  // 2. Fetch Variants and Inventory
  // We use a robust selection to handle potential missing inventory records
  const { data: rawVariants } = await supabase
    .from('product_variants')
    .select(`
      *,
      store_inventory (
        quantity
      )
    `)
    .eq('product_id', product.id);

  // 3. Robust Mapping
  const mappedVariants = (rawVariants || []).map(v => {
    // Handle both array and single object responses for inventory
    const inventory = v.store_inventory;
    let stock = 0;
    
    if (Array.isArray(inventory)) {
      stock = inventory[0]?.quantity || 0;
    } else if (inventory && typeof inventory === 'object') {
      stock = (inventory as any).quantity || 0;
    }

    return {
      ...v,
      stock: Number(stock) || 0,
      price: Number(v.price || product.price_usd || 0)
    };
  });

  const productWithVariants = {
    ...product,
    variants: mappedVariants
  };

  const settings = await getSettings();

  return (
    <main className="flex min-h-screen flex-col bg-[#0A0A0A]">
      <Navbar />
      <div className="flex-1 w-full mt-14 sm:mt-20">
        <ProductView 
          product={productWithVariants} 
          zigRate={Number(settings?.zig_rate || 13.5)} 
        />
      </div>
      <Footer />
    </main>
  );
}
