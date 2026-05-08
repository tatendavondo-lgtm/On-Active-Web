"use client";

import { useState } from "react";
import Image from "next/image";
import { useCart } from "@/store/cart";
import { toast } from "react-hot-toast";

export function ProductView({ product, zigRate }: { product: any; zigRate: number }) {
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [activeImage, setActiveImage] = useState<string>(product.images?.[0] || "/images/placeholder.jpg");
  const addItem = useCart((state) => state.addItem);

  const images = product.images || ["/images/placeholder.jpg"];
  const isSoldOut = product.stock_quantity <= 0;

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error("Please select a size first", { position: "bottom-center" });
      return;
    }
    
    addItem({
      productId: product.id,
      name: product.name,
      price_usd: product.price_usd,
      image: images[0],
      size: selectedSize,
    });
    
    toast.success("Added to cart", { position: "bottom-center", icon: "🔥" });
  };

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
              <span className="text-2xl font-black italic text-white/90">${product.price_usd.toFixed(2)}</span>
              <span className="text-sm font-bold text-white/30 tracking-widest pl-4 border-l border-white/20">
                {(product.price_usd * zigRate).toFixed(0)} ZiG
              </span>
            </div>
          </div>

          <div className="space-y-4 border-y border-white/5 py-8">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-widest text-white/50">Select Size</span>
              <button className="text-xs font-bold uppercase underline tracking-widest text-[#C5A021]">Size Guide</button>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {product.sizes?.length > 0 ? product.sizes.map((size: string) => (
                <button
                  key={size}
                  disabled={isSoldOut}
                  onClick={() => setSelectedSize(size)}
                  className={`flex h-12 min-w-12 items-center justify-center px-4 rounded-xl border text-sm font-bold transition-all disabled:opacity-20 disabled:cursor-not-allowed
                    ${selectedSize === size 
                      ? "border-[#C5A021] bg-[#C5A021]/10 text-[#C5A021]" 
                      : "border-white/10 bg-transparent text-white hover:border-white/30"}
                  `}
                >
                  {size}
                </button>
              )) : (
                <span className="text-white/30 text-xs tracking-widest">NO SIZES CONFIGURED</span>
              )}
            </div>
          </div>

          <p className="text-sm leading-relaxed text-white/60 font-medium">
            {product.description || "No description available for this product."}
          </p>

          <button
            disabled={isSoldOut}
            onClick={handleAddToCart}
            className={`w-full py-5 text-sm font-black uppercase tracking-[0.3em] transition-all
              ${isSoldOut 
                ? "bg-white/5 text-white/30 cursor-not-allowed border border-white/5" 
                : "bg-white text-[#0A0A0A] hover:bg-[#C5A021] hover:text-white"
              }
            `}
          >
            {isSoldOut ? "Sold Out" : "Add to Cart"}
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
