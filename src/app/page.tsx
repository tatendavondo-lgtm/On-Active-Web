import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { Manifesto } from "@/components/manifesto";
import { ProductGrid } from "@/components/product-grid";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <Hero />
      <Manifesto />
      <section className="bg-transparent border-y border-white/5 py-12 text-center text-white/50">
        <div className="container mx-auto px-4 overflow-hidden">
          <div className="flex animate-marquee whitespace-nowrap gap-20 py-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <span key={i} className="text-4xl font-black italic tracking-tighter uppercase sm:text-6xl hover:text-white transition-colors">
                Free Shipping on All Orders Over $150
              </span>
            ))}
          </div>
        </div>
      </section>
      <ProductGrid />
      <section className="relative h-[80vh] w-full bg-zinc-900 px-4 py-20 text-white sm:px-6">
        <div className="container mx-auto flex h-full flex-col justify-center">
          <div className="max-w-3xl space-y-8">
            <h2 className="text-5xl font-black uppercase tracking-tighter sm:text-7xl">
              MADE FOR <br /> PERFORMANCE. <br /> <span className="underline decoration-white underline-offset-8">WORN BY YOU.</span>
            </h2>
            <p className="max-w-xl text-lg font-medium leading-relaxed tracking-wide opacity-80">
              The 2026 Collection features breathable fabrics, ergonomic stitching, and high-compression support for any workout.
            </p>
            <button className="bg-white px-10 py-4 text-sm font-bold uppercase tracking-widest text-black transition-transform hover:scale-105 active:scale-95">
              Explore Collection
            </button>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
