"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useCart } from "@/store/cart";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { ShoppingCart, Check } from "lucide-react";

export function ProductView({ product, zigRate }: { product: any; zigRate: number }) {
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [justAdded, setJustAdded] = useState(false);
  const addItem = useCart((state) => state.addItem);

  // 1. Data Safety & Fallbacks
  const name = product?.name || "Premium Performance Wear";
  const basePrice = Number(product?.price_usd || 0);
  const variants = useMemo(() => Array.isArray(product?.variants) ? product.variants : [], [product]);
  const hasVariants = variants.length > 0;

  const images = useMemo(() => {
    const raw = product?.images;
    if (Array.isArray(raw) && raw.length > 0) return raw.filter((i: any) => typeof i === 'string') as string[];
    return ["/images/placeholder.jpg"];
  }, [product]);

  const [activeImage, setActiveImage] = useState<string>(images[0]);

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
    return Array.isArray(product?.sizes) ? product.sizes.filter(Boolean) : [];
  }, [product, hasVariants]);

  const selectedVariant = useMemo(() => {
    if (!hasVariants) return null;
    return variants.find((v: any) => v && v.size === selectedSize && v.color === selectedColor) || null;
  }, [variants, hasVariants, selectedSize, selectedColor]);

  // 3. Status Flags
  const isSoldOut = useMemo(() => {
    if (hasVariants) {
      return variants.every((v: any) => (Number(v?.stock) || 0) <= 0);
    }
    return (Number(product?.stock_quantity) || 0) <= 0;
  }, [variants, hasVariants, product]);

  const displayPrice = Number(selectedVariant?.price ?? basePrice);

  // 4. Effects
  useEffect(() => {
    if (images[0]) setActiveImage(images[0]);
  }, [product?.id, images]);

  if (!product) return null;

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
        productId: product.id,
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
              {product.category || "ON ACTIVE"}
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
                  <button className="text-[10px] font-black uppercase tracking-widest text-[#C5A021] underline underline-offset-2 opacity-70 hover:opacity-100 transition-opacity">
                    Size Guide
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(hasVariants ? variantSizes : simpleSizes as string[]).map((size: string) => {
                    const totalSizeStock = hasVariants 
                      ? variants.filter((v: any) => v?.size === size).reduce((sum: number, v: any) => sum + (Number(v?.stock) || 0), 0)
                      : (Number(product.stock_quantity) || 0);
                    
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
            {product.description || "Premium fitness apparel engineered for performance."}
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
    </div>
  );
}
