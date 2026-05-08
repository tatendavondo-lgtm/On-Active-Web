"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setEmail("");
  };

  return (
    <footer className="border-t border-white/5 bg-[#0A0A0A] py-12 text-gray-300 sm:py-20">
      <div className="container mx-auto px-4 sm:px-10">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-6">
            <h3 className="text-2xl font-black italic tracking-tighter text-white">
              ON ACTIVE WEAR
            </h3>
            <p className="text-sm font-medium leading-relaxed tracking-wide opacity-70">
              ELEVATING PERFORMANCE THROUGH MINIMALIST AESTHETIC.
              DESIGNED IN 2026.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-black uppercase tracking-[0.2em] text-[#C5A021]">
              SHOP
            </h4>
            <ul className="space-y-2 text-sm font-bold">
              <li>
                <Link href="/shop/men" className="hover:text-[#C5A021] transition-all hover:translate-x-1 inline-block">MEN</Link>
              </li>
              <li>
                <Link href="/shop/women" className="hover:text-[#C5A021] transition-all hover:translate-x-1 inline-block">WOMEN</Link>
              </li>
              <li>
                <Link href="/shop/accessories" className="hover:text-[#C5A021] transition-all hover:translate-x-1 inline-block">ACCESSORIES</Link>
              </li>
              <li>
                <Link href="/shop/collections" className="hover:text-[#C5A021] transition-all hover:translate-x-1 inline-block">NEW ARRIVALS</Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-black uppercase tracking-[0.2em] text-[#C5A021]">
              HELP
            </h4>
            <ul className="space-y-2 text-sm font-bold">
              <li>
                <Link href="/shipping" className="hover:text-[#C5A021] transition-all hover:translate-x-1 inline-block">SHIPPING</Link>
              </li>
              <li>
                <Link href="#" className="hover:text-[#C5A021] transition-all hover:translate-x-1 inline-block">RETURNS</Link>
              </li>
              <li>
                <Link href="#" className="hover:text-[#C5A021] transition-all hover:translate-x-1 inline-block">CONTACT</Link>
              </li>
              <li>
                <Link href="#" className="hover:text-[#C5A021] transition-all hover:translate-x-1 inline-block">FAQ</Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-black uppercase tracking-[0.2em] text-[#C5A021]">
              NEWSLETTER
            </h4>
            <p className="text-xs font-medium uppercase tracking-wide opacity-70">
              GET 15% OFF YOUR FIRST ORDER.
            </p>
            
            {subscribed ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 text-[#C5A021] text-xs font-bold uppercase tracking-widest mt-4"
              >
                <Check className="h-4 w-4" />
                Welcome to On Active.
              </motion.div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 mt-4 max-w-md">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 bg-[#1A1A1A] border border-gray-700 focus:border-[#C5A021] px-4 py-3 text-white outline-none transition-colors text-xs font-bold uppercase tracking-widest"
                />
                <button 
                  type="submit"
                  className="bg-[#C5A021] text-black font-bold px-6 py-3 uppercase tracking-wider hover:bg-[#d4af37] transition-all hover:scale-[1.02] active:scale-95"
                >
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="mt-16 flex flex-col justify-between border-t border-white/5 pt-8 text-[10px] font-bold uppercase tracking-[0.2em] sm:flex-row opacity-40">
          <span>&copy; 2026 ON ACTIVE WEAR. ALL RIGHTS RESERVED.</span>
          <div className="mt-4 flex gap-6 sm:mt-0">
            <Link href="#" className="hover:text-white transition-colors">TERMS</Link>
            <Link href="#" className="hover:text-white transition-colors">PRIVACY</Link>
            <Link href="#" className="hover:text-white transition-colors">COOKIES</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
