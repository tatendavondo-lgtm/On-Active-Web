"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { useCart } from "@/store/cart-context";
import { PRODUCTS, Product } from "@/data/products";
import { useState } from "react";

const CATEGORIES = ["ALL", "UPPER", "LOWER", "ACCESSORIES"];

export function BentoCard({ product }: { product: Product }) {
  const { addItem } = useCart();

  const handleAdd = (size: string) => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      size,
    });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`group relative flex overflow-hidden bg-[#111111] border border-white/5 rounded-3xl ${product.className || "col-span-1 row-span-1"}`}
    >
      <div className="absolute inset-0 z-0">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-1000 group-hover:scale-110 opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-80" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 flex h-full w-full flex-col justify-end p-6 sm:p-8">
        <div className="transform transition-transform duration-500 group-hover:-translate-y-6">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.4em] text-accent">
            {product.category}
          </p>
          <h3 className="mb-1 text-xl font-[900] uppercase tracking-tighter text-white sm:text-2xl">
            {product.name}
          </h3>
          <p className="text-lg font-black italic text-white/50">${product.price.toFixed(2)}</p>
        </div>

        {/* Quick Add Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 translate-y-full opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          <div className="flex flex-wrap gap-2 pt-6">
            {["XS", "S", "M", "L", "XL"].map((size) => (
              <button 
                key={size}
                onClick={() => handleAdd(size)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[11px] font-bold text-white backdrop-blur-xl transition-all hover:bg-white hover:text-black hover:scale-110"
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function ProductGrid() {
  const [activeTab, setActiveTab] = useState("ALL");

  const filteredProducts = activeTab === "ALL" 
    ? PRODUCTS 
    : PRODUCTS.filter(p => p.category === activeTab);

  return (
    <section id="trending-now" className="bg-background py-32 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-10">
        <div className="mb-20 flex flex-col items-center space-y-12 text-center">
          <div className="space-y-4">
            <span className="text-[10px] font-black uppercase tracking-[0.6em] text-accent">THE 2026 ARCHIVE</span>
            <h2 className="text-5xl font-[900] uppercase tracking-tighter text-white sm:text-8xl">
              PRODUCT ARCHIVE.
            </h2>
          </div>

          <div className="flex flex-wrap justify-center gap-4 border-y border-white/5 py-6">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`relative px-8 py-3 text-[11px] font-[900] uppercase tracking-[0.3em] transition-all
                  ${activeTab === cat ? "text-white" : "text-white/30 hover:text-white/60"}`}
              >
                {cat}
                {activeTab === cat && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" 
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        <motion.div 
          layout
          className="grid auto-rows-[350px] grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product) => (
              <BentoCard key={product.id} product={product} />
            ))}
          </AnimatePresence>
        </motion.div>

        <div className="mt-20 flex justify-center">
          <button className="group relative flex items-center gap-4 overflow-hidden border border-white/10 bg-transparent px-16 py-6 text-[12px] font-black uppercase tracking-[0.4em] text-white transition-all hover:bg-white hover:text-black">
            <span className="relative z-10">Expand Archive (285+)</span>
            <div className="absolute inset-0 translate-y-full bg-white transition-transform duration-500 group-hover:translate-y-0" />
          </button>
        </div>
      </div>
    </section>
  );
}
