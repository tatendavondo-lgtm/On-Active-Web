"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface ShopPageContentProps {
  category?: string;
  title: string;
  searchQuery?: string;
}

type SortByOption = "featured" | "newest" | "price_asc" | "price_desc";

export function ShopPageContent({ category, title, searchQuery }: ShopPageContentProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [activeGender, setActiveGender] = useState("ALL");
  const [sortBy, setSortBy] = useState<SortByOption>("featured");

  useEffect(() => {
    const savedCat = sessionStorage.getItem(`category_${window.location.pathname}`);
    if (savedCat) {
      setActiveCategory(savedCat);
    } else {
      setActiveCategory("ALL");
    }
    const savedSort = sessionStorage.getItem(`sort_${window.location.pathname}`) as SortByOption | null;
    if (savedSort) {
      setSortBy(savedSort);
    }
  }, [category]);

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    sessionStorage.setItem(`category_${window.location.pathname}`, cat);
  };

  const handleSortChange = (nextSort: SortByOption) => {
    setSortBy(nextSort);
    sessionStorage.setItem(`sort_${window.location.pathname}`, nextSort);
  };

  useEffect(() => {
    if (!loading && products.length > 0) {
      const savedScroll = sessionStorage.getItem(`scroll_${window.location.pathname}`);
      if (savedScroll) {
        const timer = setTimeout(() => {
          window.scrollTo(0, parseInt(savedScroll, 10));
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [loading, products]);

  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem(`scroll_${window.location.pathname}`, window.scrollY.toString());
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
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
              query = query.in('category', ['Tops', 'top', 'Outerwear', 'Sports Bras', 'bras', 'Upper', 'upper']);
            } else if (catLower === 'lower') {
              query = query.in('category', ['Bottoms', 'bottom', 'Leggings', 'Shorts', 'Lower', 'lower']);
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
          const cleanQ = searchQuery.replace(/[%_]/g, '').trim();
          if (cleanQ) {
            query = query.or(`name.ilike.%${cleanQ}%,category.ilike.%${cleanQ}%,description.ilike.%${cleanQ}%`);
          }
        }

        const { data, error } = await query;
        if (error) throw error;

        const dbMapped = (data || []).map(p => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: Number(p.price_usd) || 0,
          category: p.category?.toLowerCase() || 'uncategorized',
          gender: p.gender?.toLowerCase() || 'all',
          is_trending: Boolean(p.is_trending),
          is_featured: Boolean(p.is_featured),
          created_at: p.created_at || '',
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
  const GENDERS = ["ALL", "MEN", "WOMEN"];
  const catLower = category?.toLowerCase() || '';
  const isCategoryFilterable = !category || ['men', 'women', 'collections'].includes(catLower);
  const isGenderFilterable = !category || ['collections', 'accessories', 'upper', 'lower', 'sets'].includes(catLower);

  const filteredProducts = useMemo(() => {
    const filtered = products.filter(p => {
      if (isCategoryFilterable && activeCategory !== "ALL") {
        const cat = p.category.toLowerCase();
        if (activeCategory === "UPPER") {
          if (!['upper', 'tops', 'top', 'outerwear', 'sports bras', 'bras'].includes(cat)) return false;
        } else if (activeCategory === "LOWER") {
          if (!['lower', 'bottoms', 'bottom', 'leggings', 'shorts'].includes(cat)) return false;
        } else if (activeCategory === "SETS") {
          if (!['sets', 'set', 'tracksuits', 'tracksuit'].includes(cat)) return false;
        } else if (activeCategory === "ACCESSORIES") {
          if (!['accessories', 'accessory'].includes(cat)) return false;
        } else if (cat !== activeCategory.toLowerCase()) {
          return false;
        }
      }

      if (isGenderFilterable && activeGender !== "ALL") {
        const gen = p.gender.toLowerCase();
        if (gen !== activeGender.toLowerCase() && gen !== "all" && gen !== "unisex") {
          return false;
        }
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "price_asc") return a.price - b.price;
      if (sortBy === "price_desc") return b.price - a.price;
      if (sortBy === "newest") {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
      // Default: featured / trending first, then newest
      if (a.is_trending !== b.is_trending) return a.is_trending ? -1 : 1;
      if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });
  }, [products, isCategoryFilterable, activeCategory, isGenderFilterable, activeGender, sortBy]);

  return (
    <div className="container mx-auto px-4 py-32 sm:px-10">
      <div className="mb-16 space-y-4 text-center">
        <span className="text-[10px] font-black uppercase tracking-[0.6em] text-[#C5A021]">ON ACTIVE COLLECTION</span>
        <h1 className="text-5xl font-[900] uppercase tracking-tighter text-white sm:text-8xl">
          {title}.
        </h1>
      </div>

      {/* Filter & Sort Controls */}
      <div className="mb-12 flex flex-col gap-6 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
          {isCategoryFilterable && (
            <div className="flex flex-wrap items-center gap-5 sm:gap-8">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`text-[11px] font-black uppercase tracking-widest transition-all ${
                    activeCategory === cat ? "text-[#C5A021]" : "text-white/40 hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {isGenderFilterable && (
            <div className="flex items-center gap-4 border-l border-white/10 pl-0 sm:pl-6">
              {GENDERS.map((gen) => (
                <button
                  key={gen}
                  onClick={() => setActiveGender(gen)}
                  className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded transition-all ${
                    activeGender === gen
                      ? "bg-[#C5A021] text-black"
                      : "text-white/40 hover:text-white bg-white/5"
                  }`}
                >
                  {gen}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between md:justify-end gap-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
            {filteredProducts.length} {filteredProducts.length === 1 ? "ITEM" : "ITEMS"}
          </span>
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value as SortByOption)}
            aria-label="Sort products"
            className="bg-[#111] border border-white/10 rounded-lg px-3.5 py-2 text-[11px] font-black uppercase tracking-widest text-white outline-none focus:border-[#C5A021] transition-colors"
          >
            <option value="featured">SORT: FEATURED</option>
            <option value="newest">SORT: NEWEST</option>
            <option value="price_asc">PRICE: LOW TO HIGH</option>
            <option value="price_desc">PRICE: HIGH TO LOW</option>
          </select>
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
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-6 border border-white/5 rounded-2xl bg-[#111]/40">
          <p className="text-lg font-black uppercase tracking-widest text-white/50">
            No products match your selected filters.
          </p>
          {(activeCategory !== "ALL" || activeGender !== "ALL") && (
            <button
              onClick={() => {
                handleCategoryChange("ALL");
                setActiveGender("ALL");
              }}
              className="border border-[#C5A021] px-8 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A021] transition-all hover:bg-[#C5A021] hover:text-black"
            >
              Reset Filters
            </button>
          )}
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
