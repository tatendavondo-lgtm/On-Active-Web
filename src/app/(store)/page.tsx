"use client";

import { Navbar } from '@/components/navbar';
import { Hero } from '@/components/hero';
import { Manifesto } from '@/components/manifesto';
import { InnovationTicker } from '@/components/innovation-ticker';
import { ProductGrid } from '@/components/product-grid';
import { Footer } from '@/components/footer';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] text-gray-300">
      <Navbar />
      <Hero />
      <Manifesto />
      <InnovationTicker />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <ProductGrid />
      </motion.div>
      
      {/* Engineered for Extremes Section */}
      <section className="relative h-[90vh] w-full overflow-hidden flex items-center">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/products/TGIS 100.jpg"
            alt="Performance Background"
            fill
            className="object-cover opacity-40 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent" />
        </div>
        
        <div className="container relative z-10 mx-auto px-4 sm:px-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl space-y-8"
          >
            <h2 className="text-5xl font-black uppercase tracking-[0.2em] sm:text-8xl leading-[0.9] text-white">
              ENGINEERED <br /> FOR <span className="text-[#C5A021]">EXTREMES.</span>
            </h2>
            <p className="max-w-xl text-lg font-medium leading-relaxed tracking-wide text-gray-300 border-l-2 border-[#C5A021] pl-6 ml-1">
              4-way stretch compression fabric. Flatlock seam construction. Moisture-wicking technology. Built for athletes who demand more.
            </p>
            <Link 
              href="/shop/collections" 
              className="group mt-4 inline-block relative bg-[#C5A021] px-12 py-5 text-[11px] font-black uppercase tracking-[0.4em] text-black transition-all hover:scale-[1.02] active:scale-95 duration-300"
            >
              Shop the 2026 Collection →
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Beyond Limits Section */}
      <section className="relative h-[80vh] w-full overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/products/TGIS 150.jpg"
            alt="Cinematic Background"
            fill
            className="object-cover opacity-30 grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center space-y-8 px-4"
        >
          <div className="space-y-4">
            <h3 className="text-4xl font-black uppercase tracking-[0.4em] text-white/20 sm:text-7xl">
              BEYOND LIMITS
            </h3>
            <p className="text-sm font-bold uppercase tracking-[0.4em] text-[#C5A021]">Est. 2026 — On Active</p>
          </div>
          <p className="max-w-md mx-auto text-lg font-bold uppercase tracking-[0.2em] text-gray-300">
            Performance meets precision. Every thread engineered for your edge.
          </p>
          <Link 
            href="/shop/collections" 
            className="group inline-block border border-[#C5A021] px-10 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A021] transition-all hover:bg-[#C5A021] hover:text-black hover:scale-[1.02] duration-300"
          >
            Discover the Collection →
          </Link>
        </motion.div>
      </section>

      <Footer />
    </main>
  );
}
