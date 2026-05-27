"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const CATEGORIES = ["ALL", "UPPER", "LOWER", "ACCESSORIES"];

export function ProductGrid() {
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true);

        if (error) throw error;

        const dbMapped = (data || []).map(p => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: p.price_usd,
          category: p.category?.toLowerCase() || 'uncategorized',
          image: p.images?.[0] || null
        }));

        setProducts(dbMapped);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
    const interval = setInterval(fetchProducts, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredProducts = products.filter(p => {
    if (activeCategory === "ALL") return true;
    
    const cat = p.category.toLowerCase();
    
    if (activeCategory === "UPPER") {
      return ['tops', 'top', 'outerwear', 'sports bras', 'bras'].includes(cat);
    }
    if (activeCategory === "LOWER") {
      return ['bottoms', 'bottom', 'leggings', 'shorts'].includes(cat);
    }
    if (activeCategory === "ACCESSORIES") {
      return ['accessories', 'accessory'].includes(cat);
    }
    
    return cat === activeCategory.toLowerCase();
  });

  return (
    <section id="trending-now" className="bg-[#0A0A0A] py-24 text-white sm:py-32">
      <div className="container mx-auto px-4 sm:px-10">
        <div className="mb-16 flex flex-col items-end justify-between gap-8 md:flex-row md:items-center">
          <div className="space-y-4">
            <span className="text-[10px] font-black uppercase tracking-[0.6em] text-[#C5A021]">TRENDING NOW</span>
            <h2 className="text-5xl font-[900] uppercase tracking-tighter sm:text-7xl">
              PRODUCT <span className="text-white/20">ARCHIVE.</span>
            </h2>
          </div>
          
          <div className="flex flex-wrap gap-4 border-b border-white/10 pb-4">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeCategory === cat ? "text-[#C5A021]" : "text-white/40 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="space-y-4">
                <div className="aspect-[3/4] animate-pulse rounded-2xl bg-[#1A1A1A]" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-[#1A1A1A]" />
                <div className="h-4 w-1/4 animate-pulse rounded bg-[#1A1A1A]" />
              </div>
            ))}
          </div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
          >
            <AnimatePresence>
              {filteredProducts.slice(0, 6).map((product) => (
                <Link key={product.id} href={`/shop/${product.slug}`}>
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ scale: 1.02 }}
                    className="group relative flex flex-col bg-[#111] border border-white/5 rounded-2xl overflow-hidden transition-all duration-300"
                  >
                    <div className="relative aspect-[3/4] w-full bg-[#1A1A1A]">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="h-full w-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-110" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center opacity-10">
                          <span className="text-4xl font-black italic tracking-tighter">ON ACTIVE.</span>
                        </div>
                      )}
                    </div>
                    <div className="p-6 space-y-2">
                      <div className="flex justify-between items-start">
                        <h3 className="text-xl font-black uppercase tracking-tight text-white leading-tight">{product.name}</h3>
                        <p className="text-xl font-black italic text-[#C5A021]">${product.price}</p>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        <div className="mt-20 flex justify-center">
          <Link 
            href="/shop/collections"
            className="group relative flex items-center gap-4 border border-white/10 px-12 py-6 text-[10px] font-black uppercase tracking-[0.4em] transition-all hover:bg-[#C5A021] hover:text-black hover:border-[#C5A021]"
          >
            View All Products -&#62;
          </Link>
        </div>
      </div>
    </section>
  );
}
