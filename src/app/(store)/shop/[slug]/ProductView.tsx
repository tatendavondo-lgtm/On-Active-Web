"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useCart } from "@/store/cart";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function ProductView({ product, zigRate }: { product: any; zigRate: number }) {
  const [liveProduct, setLiveProduct] = useState(product);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [justAdded, setJustAdded] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState<"women" | "men">("women");
  
  const addItem = useCart((state) => state.addItem);

  // Sync prop changes to state
  useEffect(() => {
    setLiveProduct(product);
  }, [product]);

  // Live polling every 5 seconds from Supabase
  useEffect(() => {
    if (!product?.id) return;
    const supabase = createClient();

    async function syncData() {
      try {
        // 1. Fetch live product details
        const { data: freshProduct, error: prodErr } = await supabase
          .from('products')
          .select('*')
          .eq('id', product.id)
          .single();

        if (prodErr || !freshProduct) return;

        // 2. Fetch live variants and inventory
        const { data: rawVariants } = await supabase
          .from('product_variants')
          .select(`
            *,
            store_inventory (
              quantity
            )
          `)
          .eq('product_id', product.id);

        const mappedVariants = (rawVariants || []).map((v: any) => {
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
            price: Number(v.price || freshProduct.price_usd || 0)
          };
        });

        setLiveProduct({
          ...freshProduct,
          variants: mappedVariants
        });
      } catch (err) {
        console.error("Error syncing product details:", err);
      }
    }

    const interval = setInterval(syncData, 5000);
    return () => clearInterval(interval);
  }, [product?.id]);

  // 1. Data Safety & Fallbacks
  const name = liveProduct?.name || "Premium Performance Wear";
  const basePrice = Number(liveProduct?.price_usd || 0);
  const variants = useMemo(() => Array.isArray(liveProduct?.variants) ? liveProduct.variants : [], [liveProduct]);
  const hasVariants = variants.length > 0;

  const images = useMemo(() => {
    const raw = liveProduct?.images;
    if (Array.isArray(raw) && raw.length > 0) return raw.filter((i: any) => typeof i === 'string') as string[];
    return ["/images/placeholder.jpg"];
  }, [liveProduct]);

  const [activeImage, setActiveImage] = useState<string>(images[0]);

  useEffect(() => {
    if (images[0]) setActiveImage(images[0]);
  }, [liveProduct?.id, images]);

  // 2. Computed Selections
  const variantSizes = useMemo(() => {
    if (!hasVariants) return [];
    return Array.from(new Set(variants.map((v: any) => v?.size).filter(Boolean))) as string[];
  }, [variants, hasVariants]);

  const availableColorsForSize = useMemo(() => {
    if (!hasVariants || !selectedSize) return [];
    return Array.from(new Set(
      variants
        .filter((v: any) => v && v.size === selectedSize)
        .map((v: any) => v.color)
        .filter(Boolean)
    )) as string[];
  }, [variants, hasVariants, selectedSize]);

  const simpleSizes = useMemo(() => {
    if (hasVariants) return [];
    return Array.isArray(liveProduct?.sizes) ? liveProduct.sizes.filter(Boolean) : [];
  }, [liveProduct, hasVariants]);

  const selectedVariant = useMemo(() => {
    if (!hasVariants) return null;
    return variants.find((v: any) => v && v.size === selectedSize && v.color === selectedColor) || null;
  }, [variants, hasVariants, selectedSize, selectedColor]);

  // 3. Status Flags
  const isSoldOut = useMemo(() => {
    if (hasVariants) {
      return variants.every((v: any) => (Number(v?.stock) || 0) <= 0);
    }
    return (Number(liveProduct?.stock_quantity) || 0) <= 0;
  }, [variants, hasVariants, liveProduct]);

  const displayPrice = Number(selectedVariant?.price ?? basePrice);

  if (!liveProduct) return null;

  const handleAddToCart = () => {
    try {
      if (hasVariants) {
        if (!selectedSize) {
          toast.error("Please select a size first", { position: "bottom-center" });
          return;
        }
        if (availableColorsForSize.length > 0 && !selectedColor) {
          toast.error("Please select a colour", { position: "bottom-center" });
          return;
        }
        if (!selectedVariant && availableColorsForSize.length > 0) {
          toast.error("That combo is unavailable", { position: "bottom-center" });
          return;
        }
      } else {
        if (simpleSizes.length > 0 && !selectedSize) {
          toast.error("Please select a size first", { position: "bottom-center" });
          return;
        }
      }

      addItem({
        productId: liveProduct.id,
        variantId: selectedVariant?.id,
        name: name,
        price_usd: displayPrice,
        image: images[0],
        size: selectedVariant?.size ?? selectedSize ?? "One Size",
        color: selectedVariant?.color ?? selectedColor ?? "",
      });

      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2000);
      toast.success(`${name} added to cart 🔥`, { position: "bottom-center" });
    } catch (err) {
      toast.error("Failed to add to cart");
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 sm:px-10 text-white">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">

        {/* ── Image Gallery ── */}
        <div className="space-y-4">
          <motion.div
            key={activeImage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-[#111111] border border-white/5"
          >
            <Image
              src={activeImage}
              alt={name}
              fill
              className="object-cover"
              priority
            />
          </motion.div>

          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {images.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`relative h-24 w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                    activeImage === img ? "border-[#C5A021]" : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image src={img} alt={`View ${idx + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Product Info ── */}
        <div className="flex flex-col space-y-8">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#C5A021] mb-3">
              {liveProduct.category || "ON ACTIVE"}
            </p>
            <h1 className="text-4xl sm:text-6xl font-[900] uppercase tracking-tighter text-white leading-none">
              {name}
            </h1>
            <div className="mt-5 flex items-end gap-4">
              <span className="text-3xl font-black italic text-white">${displayPrice.toFixed(2)}</span>
              <span className="text-sm font-bold text-white/30 tracking-widest pb-0.5">
                {(displayPrice * (zigRate || 1)).toFixed(0)} ZiG
              </span>
            </div>
          </div>

          <div className="space-y-8 border-y border-white/5 py-8">
            {/* Size Selection */}
            {(hasVariants ? variantSizes : simpleSizes).length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/50">
                    1. Choose Size {selectedSize && <span className="text-[#C5A021]"> — {selectedSize}</span>}
                  </span>
                  <button 
                    onClick={() => setIsSizeGuideOpen(true)}
                    className="text-[10px] font-black uppercase tracking-widest text-[#C5A021] underline underline-offset-2 opacity-70 hover:opacity-100 transition-opacity"
                  >
                    Size Guide
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(hasVariants ? variantSizes : simpleSizes as string[]).map((size: string) => {
                    const totalSizeStock = hasVariants 
                      ? variants.filter((v: any) => v?.size === size).reduce((sum: number, v: any) => sum + (Number(v?.stock) || 0), 0)
                      : (Number(liveProduct.stock_quantity) || 0);
                    
                    return (
                      <button
                        key={size}
                        disabled={totalSizeStock <= 0}
                        onClick={() => { setSelectedSize(size); setSelectedColor(""); }}
                        className={`group relative h-14 min-w-[64px] px-4 rounded-xl border transition-all disabled:opacity-20 ${
                          selectedSize === size ? "border-[#C5A021] bg-[#C5A021]/10 text-[#C5A021]" : "border-white/10 text-white/70 hover:border-white/30"
                        }`}
                      >
                        <span className="text-xs font-black uppercase tracking-widest">{size}</span>
                        {totalSizeStock > 0 && totalSizeStock < 5 && (
                          <span className="absolute -top-2 -right-2 bg-red-500 text-[8px] font-black px-1.5 py-0.5 rounded-full text-white">
                            {totalSizeStock}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              !hasVariants && <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">One Size</p>
            )}

            {/* Color Selection */}
            {hasVariants && selectedSize && availableColorsForSize.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/50">
                  2. Choose Colour {selectedColor && <span className="text-[#C5A021]"> — {selectedColor}</span>}
                </span>
                <div className="flex flex-wrap gap-2">
                  {availableColorsForSize.map((color: string) => {
                    const vMatch = variants.find((v: any) => v?.size === selectedSize && v?.color === color);
                    const vStock = Number(vMatch?.stock || 0);
                    return (
                      <button
                        key={color}
                        disabled={vStock <= 0}
                        onClick={() => setSelectedColor(color)}
                        className={`px-5 py-3 rounded-xl border transition-all disabled:opacity-20 ${
                          selectedColor === color ? "border-[#C5A021] bg-[#C5A021]/10 text-[#C5A021]" : "border-white/10 text-white/70 hover:border-white/30"
                        }`}
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-black uppercase tracking-widest">{color}</span>
                          <span className="text-[9px] font-bold opacity-50">{vStock} IN STOCK</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Stock status summary */}
            {selectedVariant && (
              <p className={`text-[10px] font-bold uppercase tracking-widest ${selectedVariant.stock > 0 ? "text-[#C5A021]" : "text-red-400"}`}>
                {selectedVariant.stock > 0 ? `Ready to ship — ${selectedVariant.stock} units available` : "Out of stock for this combo"}
              </p>
            )}
          </div>

          <p className="text-sm leading-relaxed text-white/60 font-medium">
            {liveProduct.description || "Premium fitness apparel engineered for performance."}
          </p>

          <motion.button
            disabled={isSoldOut || (selectedVariant && selectedVariant.stock <= 0)}
            onClick={handleAddToCart}
            whileTap={{ scale: 0.97 }}
            className={`w-full py-5 flex items-center justify-center gap-3 text-sm font-black uppercase tracking-[0.3em] rounded-xl transition-all duration-300 ${
              isSoldOut ? "bg-white/5 text-white/20 cursor-not-allowed" : justAdded ? "bg-[#C5A021] text-black" : "bg-white text-[#0A0A0A] hover:bg-[#C5A021] hover:text-black"
            }`}
          >
            {isSoldOut ? "Sold Out" : justAdded ? <><Check size={16} strokeWidth={3}/> Added to Cart</> : <><ShoppingCart size={16}/> Add to Cart</>}
          </motion.button>

          <ul className="space-y-2 text-[10px] uppercase font-bold tracking-[0.2em] text-white/30">
            <li className="flex items-center gap-2"><span className="h-1 w-1 bg-[#C5A021] rounded-full flex-shrink-0" /> Nationwide Delivery</li>
            <li className="flex items-center gap-2"><span className="h-1 w-1 bg-[#C5A021] rounded-full flex-shrink-0" /> Premium Quality Assured</li>
            <li className="flex items-center gap-2"><span className="h-1 w-1 bg-[#C5A021] rounded-full flex-shrink-0" /> Secure Checkout</li>
          </ul>
        </div>
      </div>

      {/* ── Size Guide Modal Overlay ── */}
      <AnimatePresence>
        {isSizeGuideOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSizeGuideOpen(false)}
              className="absolute inset-0 bg-black"
            />
            
            {/* Drawer Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative z-10 h-full w-full max-w-md bg-[#0D0D0D] border-l border-white/10 p-8 shadow-2xl flex flex-col justify-between overflow-y-auto text-white"
            >
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#C5A021]">ON ACTIVE</span>
                    <h2 className="text-3xl font-[900] uppercase tracking-tighter">SIZE GUIDE</h2>
                  </div>
                  <button 
                    onClick={() => setIsSizeGuideOpen(false)}
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Tab Selector */}
                <div className="flex border-b border-white/10 mb-8">
                  <button
                    onClick={() => setActiveGuideTab("women")}
                    className={`flex-1 pb-4 text-xs font-black uppercase tracking-widest transition-all ${
                      activeGuideTab === "women" ? "text-[#C5A021] border-b-2 border-[#C5A021]" : "text-white/40 hover:text-white"
                    }`}
                  >
                    WOMEN
                  </button>
                  <button
                    onClick={() => setActiveGuideTab("men")}
                    className={`flex-1 pb-4 text-xs font-black uppercase tracking-widest transition-all ${
                      activeGuideTab === "men" ? "text-[#C5A021] border-b-2 border-[#C5A021]" : "text-white/40 hover:text-white"
                    }`}
                  >
                    MEN
                  </button>
                </div>

                {/* Size Charts */}
                <div className="space-y-8">
                  {activeGuideTab === "women" ? (
                    <>
                      {/* Women Tops/Sports Bras */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-[#C5A021]">TOPS & SPORTS BRAS</h3>
                        <div className="overflow-hidden rounded-xl border border-white/5 bg-[#121212]">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/40">
                                <th className="p-3">SIZE</th>
                                <th className="p-3">CHEST (IN)</th>
                                <th className="p-3">BUST (CM)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 font-medium text-white/70">
                              <tr><td className="p-3 font-black text-white">XS</td><td className="p-3">30 - 32</td><td className="p-3">76 - 81</td></tr>
                              <tr><td className="p-3 font-black text-white">S</td><td className="p-3">32 - 34</td><td className="p-3">81 - 86</td></tr>
                              <tr><td className="p-3 font-black text-white">M</td><td className="p-3">34 - 36</td><td className="p-3">86 - 91</td></tr>
                              <tr><td className="p-3 font-black text-white">L</td><td className="p-3">36 - 38</td><td className="p-3">91 - 96</td></tr>
                              <tr><td className="p-3 font-black text-white">XL</td><td className="p-3">38 - 40</td><td className="p-3">96 - 101</td></tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Women Bottoms/Leggings */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-[#C5A021]">LEGGINGS & BOTTOMS</h3>
                        <div className="overflow-hidden rounded-xl border border-white/5 bg-[#121212]">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/40">
                                <th className="p-3">SIZE</th>
                                <th className="p-3">WAIST (IN)</th>
                                <th className="p-3">HIPS (IN)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 font-medium text-white/70">
                              <tr><td className="p-3 font-black text-white">XS</td><td className="p-3">24 - 26</td><td className="p-3">34 - 36</td></tr>
                              <tr><td className="p-3 font-black text-white">S</td><td className="p-3">26 - 28</td><td className="p-3">36 - 38</td></tr>
                              <tr><td className="p-3 font-black text-white">M</td><td className="p-3">28 - 30</td><td className="p-3">38 - 40</td></tr>
                              <tr><td className="p-3 font-black text-white">L</td><td className="p-3">30 - 32</td><td className="p-3">40 - 42</td></tr>
                              <tr><td className="p-3 font-black text-white">XL</td><td className="p-3">32 - 35</td><td className="p-3">42 - 45</td></tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Men Tops */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-[#C5A021]">TOPS & JACKETS</h3>
                        <div className="overflow-hidden rounded-xl border border-white/5 bg-[#121212]">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/40">
                                <th className="p-3">SIZE</th>
                                <th className="p-3">CHEST (IN)</th>
                                <th className="p-3">CHEST (CM)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 font-medium text-white/70">
                              <tr><td className="p-3 font-black text-white">S</td><td className="p-3">35 - 37</td><td className="p-3">89 - 94</td></tr>
                              <tr><td className="p-3 font-black text-white">M</td><td className="p-3">38 - 40</td><td className="p-3">96 - 102</td></tr>
                              <tr><td className="p-3 font-black text-white">L</td><td className="p-3">41 - 43</td><td className="p-3">104 - 109</td></tr>
                              <tr><td className="p-3 font-black text-white">XL</td><td className="p-3">44 - 46</td><td className="p-3">112 - 117</td></tr>
                              <tr><td className="p-3 font-black text-white">XXL</td><td className="p-3">47 - 49</td><td className="p-3">119 - 124</td></tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Men Bottoms */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-[#C5A021]">SHORTS & JOGGERS</h3>
                        <div className="overflow-hidden rounded-xl border border-white/5 bg-[#121212]">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/40">
                                <th className="p-3">SIZE</th>
                                <th className="p-3">WAIST (IN)</th>
                                <th className="p-3">WAIST (CM)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 font-medium text-white/70">
                              <tr><td className="p-3 font-black text-white">S</td><td className="p-3">29 - 31</td><td className="p-3">74 - 79</td></tr>
                              <tr><td className="p-3 font-black text-white">M</td><td className="p-3">32 - 34</td><td className="p-3">81 - 86</td></tr>
                              <tr><td className="p-3 font-black text-white">L</td><td className="p-3">35 - 37</td><td className="p-3">89 - 94</td></tr>
                              <tr><td className="p-3 font-black text-white">XL</td><td className="p-3">38 - 40</td><td className="p-3">96 - 102</td></tr>
                              <tr><td className="p-3 font-black text-white">XXL</td><td className="p-3">41 - 43</td><td className="p-3">104 - 109</td></tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-12 text-center text-[10px] uppercase font-bold tracking-[0.2em] text-white/30 border-t border-white/5 pt-6">
                * Fit may vary depending on style and fabric cut.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
