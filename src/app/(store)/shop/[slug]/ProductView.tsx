"use client";

import { useState } from "react";
import Image from "next/image";
import { useCart } from "@/store/cart";
import { toast } from "react-hot-toast";

export function ProductView({ product, zigRate }: { product: any; zigRate: number }) {
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [activeImage, setActiveImage] = useState<string>(product.images?.[0] || "/images/placeholder.jpg");
  const addItem = useCart((state) => state.addItem);

  const images = product.images || ["/images/placeholder.jpg"];
  const variants = product.variants || [];
  
  const selectedVariant = variants.find((v: any) => v.id === selectedVariantId);
  const isSoldOut = variants.length > 0 
    ? variants.every((v: any) => v.stock <= 0) 
    : product.stock_quantity <= 0;

  const colors = Array.from(new Set(variants.map((v: any) => v.color).filter(Boolean)));
  const sizes = Array.from(new Set(variants.map((v: any) => v.size).filter(Boolean)));

  // If no explicit variants, fallback to basic sizes
  const displaySizes = sizes.length > 0 ? sizes : (product.sizes || []);

  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");

  const handleAddToCart = () => {
    if (variants.length > 0 && !selectedVariant) {
      toast.error("Please select both color and size", { position: "bottom-center" });
      return;
    }

    if (variants.length === 0 && !selectedSize && displaySizes.length > 0) {
      toast.error("Please select a size first", { position: "bottom-center" });
      return;
    }
    
    addItem({
      productId: product.id,
      variantId: selectedVariant?.id,
      name: product.name,
      price_usd: selectedVariant?.price || product.price_usd,
      image: images[0],
      size: selectedVariant?.size || selectedSize,
      color: selectedVariant?.color || "",
    });
    
    toast.success("Added to cart", { position: "bottom-center", icon: "🔥" });
  };

  // Find variant based on color and size
  useEffect(() => {
    if (selectedColor && selectedSize) {
      const match = variants.find((v: any) => v.color === selectedColor && v.size === selectedSize);
      if (match) setSelectedVariantId(match.id);
      else setSelectedVariantId("");
    }
  }, [selectedColor, selectedSize, variants]);

  return (
    <div className="container mx-auto px-4 py-12 sm:px-10">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        {/* Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-[#111111] border border-white/5">
            <Image 
              src={activeImage} 
              alt={product.name} 
              fill 
              className="object-cover"
              priority
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {images.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`relative h-24 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 ${
                    activeImage === img ? "border-[#C5A021]" : "border-transparent"
                  } transition-colors`}
                >
                  <Image src={img} alt={`Gallery ${idx}`} fill className="object-cover opacity-80 hover:opacity-100" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col space-y-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.4em] text-[#C5A021] mb-4">
              {product.category}
            </p>
            <h1 className="text-4xl sm:text-6xl font-[900] uppercase tracking-tighter text-white">
              {product.name}
            </h1>
            <div className="mt-4 flex items-center gap-4">
              <span className="text-2xl font-black italic text-white/90">${(selectedVariant?.price || product.price_usd).toFixed(2)}</span>
              <span className="text-sm font-bold text-white/30 tracking-widest pl-4 border-l border-white/20">
                {((selectedVariant?.price || product.price_usd) * zigRate).toFixed(0)} ZiG
              </span>
            </div>
          </div>

          <div className="space-y-8 border-y border-white/5 py-8">
            {/* Color Selection */}
            {colors.length > 0 && (
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-widest text-white/50">Select Color</span>
                <div className="flex flex-wrap gap-3">
                  {colors.map((color: any) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-6 py-3 rounded-xl border text-sm font-bold transition-all
                        ${selectedColor === color 
                          ? "border-[#C5A021] bg-[#C5A021]/10 text-[#C5A021]" 
                          : "border-white/10 bg-transparent text-white hover:border-white/30"}
                      `}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-widest text-white/50">Select Size</span>
                <button className="text-xs font-bold uppercase underline tracking-widest text-[#C5A021]">Size Guide</button>
              </div>
              
              <div className="flex flex-wrap gap-3">
                {displaySizes.length > 0 ? displaySizes.map((size: string) => {
                  const isAvailable = selectedColor 
                    ? variants.some((v: any) => v.color === selectedColor && v.size === size && v.stock > 0)
                    : true; // If no color selected yet, show all base sizes
                    
                  return (
                    <button
                      key={size}
                      disabled={!isAvailable}
                      onClick={() => setSelectedSize(size)}
                      className={`flex h-12 min-w-12 items-center justify-center px-4 rounded-xl border text-sm font-bold transition-all disabled:opacity-20 disabled:cursor-not-allowed
                        ${selectedSize === size 
                          ? "border-[#C5A021] bg-[#C5A021]/10 text-[#C5A021]" 
                          : "border-white/10 bg-transparent text-white hover:border-white/30"}
                      `}
                    >
                      {size}
                    </button>
                  );
                }) : (
                  <span className="text-white/30 text-xs tracking-widest">ONE SIZE</span>
                )}
              </div>
            </div>

            {selectedVariant && (
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#C5A021]">
                {selectedVariant.stock > 0 ? `${selectedVariant.stock} units available` : "Out of stock in this combo"}
              </p>
            )}
          </div>

          <p className="text-sm leading-relaxed text-white/60 font-medium">
            {product.description || "No description available for this product."}
          </p>

          <button
            disabled={isSoldOut || (selectedVariant && selectedVariant.stock <= 0)}
            onClick={handleAddToCart}
            className={`w-full py-5 text-sm font-black uppercase tracking-[0.3em] transition-all
              ${(isSoldOut || (selectedVariant && selectedVariant.stock <= 0))
                ? "bg-white/5 text-white/30 cursor-not-allowed border border-white/5" 
                : "bg-white text-[#0A0A0A] hover:bg-[#C5A021] hover:text-white"
              }
            `}
          >
            {isSoldOut ? "Sold Out" : (selectedVariant && selectedVariant.stock <= 0) ? "Combo Out of Stock" : "Add to Cart"}
          </button>
          
          <div className="pt-6 border-t border-white/5">
            <ul className="space-y-2 text-[10px] uppercase font-bold tracking-[0.2em] text-white/40">
              <li className="flex items-center gap-2"><span className="h-1 w-1 bg-[#C5A021] rounded-full" /> Nationwide Delivery</li>
              <li className="flex items-center gap-2"><span className="h-1 w-1 bg-[#C5A021] rounded-full" /> Premium Quality Assured</li>
              <li className="flex items-center gap-2"><span className="h-1 w-1 bg-[#C5A021] rounded-full" /> Secure Checkout</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
