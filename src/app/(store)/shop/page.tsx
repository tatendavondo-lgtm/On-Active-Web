import { ProductGrid } from '@/components/product-grid';
import { Footer } from '@/components/footer';
import { Navbar } from '@/components/navbar';

export default function ShopPage() {
  return (
    <main className="flex min-h-screen flex-col bg-[#0A0A0A]">
      <Navbar />
      <div className="pt-14 sm:pt-20">
        <ProductGrid />
      </div>
      <Footer />
    </main>
  );
}
