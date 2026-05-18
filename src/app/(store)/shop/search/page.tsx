import { ShopPageContent } from "@/components/shop-page-content";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const searchQuery = q || "";

  return (
    <main className="flex min-h-screen flex-col bg-[#0A0A0A]">
      <Navbar />
      <div className="flex-1 w-full">
        <ShopPageContent 
          title={searchQuery ? `SEARCH: ${searchQuery}` : "SEARCH RESULTS"} 
          searchQuery={searchQuery}
        />
      </div>
      <Footer />
    </main>
  );
}
