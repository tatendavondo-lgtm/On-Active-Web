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
  const [activeCategory, setActiveCategory] = useState("ALL");

  useEffect(() => {
    async function fetchProducts() {
      try {
        const supabase = createClient();
        let query = supabase.from('products').select('*').eq('is_active', true);
        
        const catLower = category?.toLowerCase();
        if (catLower) {
          if (catLower === 'men') {
            query = query.in('gender', ['Men', 'men', 'All', 'all', 'Unisex', 'unisex', 'ALL']);
          } else if (catLower === 'women') {
            query = query.in('gender', ['Women', 'women', 'All', 'all', 'Unisex', 'unisex', 'ALL']);
          } else if (catLower !== 'collections') {
            if (catLower === 'upper') {
              query = query.in('category', ['Tops', 'top', 'Outerwear', 'Sports Bras', 'bras']);
            } else if (catLower === 'lower') {
              query = query.in('category', ['Bottoms', 'bottom', 'Leggings', 'Shorts']);
            } else if (catLower === 'sets') {
              query = query.in('category', ['Sets', 'set', 'Tracksuits', 'tracksuit']);
            } else if (catLower === 'accessories') {
              query = query.in('category', ['Accessories', 'accessory']);
            } else {
              query = query.ilike('category', category as string);
            }
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
          gender: p.gender?.toLowerCase() || 'all',
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
  }, [category, searchQuery]);

  const CATEGORIES = ["ALL", "UPPER", "LOWER", "SETS", "ACCESSORIES"];
  const isFilterable = ['men', 'women', 'collections'].includes(category?.toLowerCase() || '');

  const filteredProducts = products.filter(p => {
    if (!isFilterable || activeCategory === "ALL") return true;
    const cat = p.category.toLowerCase();
    if (activeCategory === "UPPER") {
      return ['tops', 'top', 'outerwear', 'sports bras', 'bras'].includes(cat);
    }
    if (activeCategory === "LOWER") {
      return ['bottoms', 'bottom', 'leggings', 'shorts'].includes(cat);
    }
    if (activeCategory === "SETS") {
      return ['sets', 'set', 'tracksuits', 'tracksuit'].includes(cat);
    }
    if (activeCategory === "ACCESSORIES") {
      return ['accessories', 'accessory'].includes(cat);
    }
    return cat === activeCategory.toLowerCase();
  });

  return (
    <div className="container mx-auto px-4 py-32 sm:px-10">
      <div className="mb-20 space-y-4 text-center">
        <span className="text-[10px] font-black uppercase tracking-[0.6em] text-[#C5A021]">ON ACTIVE COLLECTION</span>
        <h1 className="text-5xl font-[900] uppercase tracking-tighter text-white sm:text-8xl">
          {title}.
        </h1>
      </div>

      {isFilterable && (
        <div className="mb-12 flex justify-center border-b border-white/10 pb-6">
          <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-[11px] font-black uppercase tracking-widest transition-all ${
                  activeCategory === cat ? "text-[#C5A021]" : "text-white/40 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

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
            {filteredProducts.map((product) => (
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
