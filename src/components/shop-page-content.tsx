"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface ShopPageContentProps {
  category?: string;
  title: string;
  searchQuery?: string;
}

export function ShopPageContent({ category, title, searchQuery }: ShopPageContentProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const supabase = createClient();
        let query = supabase.from('products').select('*').eq('is_active', true);
        
        if (category && category !== 'collections') {
          const cat = category.toLowerCase();
          if (cat === 'upper') {
            query = query.in('category', ['Tops', 'top', 'Outerwear', 'Sports Bras', 'bras']);
          } else if (cat === 'lower') {
            query = query.in('category', ['Bottoms', 'bottom', 'Leggings', 'Shorts']);
          } else if (cat === 'accessories') {
            query = query.in('category', ['Accessories', 'accessory']);
          } else {
            query = query.ilike('category', category);
          }
        }

        if (searchQuery) {
          query = query.ilike('name', `%${searchQuery}%`);
        }

        const { data, error } = await query;
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
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [category]);

  return (
    <div className="container mx-auto px-4 py-32 sm:px-10">
      <div className="mb-20 space-y-4 text-center">
        <span className="text-[10px] font-black uppercase tracking-[0.6em] text-[#C5A021]">ON ACTIVE COLLECTION</span>
        <h1 className="text-5xl font-[900] uppercase tracking-tighter text-white sm:text-8xl">
          {title}.
        </h1>
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence>
            {products.map((product) => (
              <Link key={product.id} href={`/shop/${product.slug}`}>
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  className="group flex flex-col bg-[#111] border border-white/5 rounded-2xl overflow-hidden transition-all duration-300"
                >
                  <div className="relative aspect-[3/4] w-full bg-[#1A1A1A]">
                    {product.image ? (
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center opacity-10">
                        <span className="text-4xl font-black italic tracking-tighter">ON ACTIVE.</span>
                      </div>
                    )}
                  </div>
                  <div className="p-6 space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#C5A021] opacity-70">
                      {product.category}
                    </span>
                    <h3 className="text-xl font-black uppercase tracking-tight text-white leading-tight">
                      {product.name}
                    </h3>
                    <p className="text-2xl font-black italic text-[#C5A021]">
                      ${product.price}
                    </p>
                  </div>
                </motion.div>
              </Link>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
