"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Menu, Search, User, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/store/cart";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const cartCount = useCart(state => state.getCartCount());
  const setIsCartOpen = useCart(state => state.setIsCartOpen);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`/shop/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsMenuOpen(false);
      setSearchQuery("");
    }
  };

  const navItems = ["Men", "Women", "Accessories", "Collections"];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0A0A0A]/70 text-white backdrop-blur-xl">
      <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:h-20 sm:px-10">
        <div className="flex items-center gap-12">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-white/20 transition-colors group-hover:border-[#C5A021]">
              <Image 
                src="/images/logo.jpg" 
                alt="On Active Wear" 
                fill 
                className="object-cover"
              />
            </div>
            <span className="text-2xl font-[900] tracking-tighter sm:text-3xl">
              ON <span className="text-[#C5A021]">ACTIVE</span>.
            </span>
          </Link>
          
          <div className="hidden items-center gap-8 lg:flex">
            {navItems.map((item) => (
              <Link 
                key={item} 
                href={`/shop/${item.toLowerCase()}`} 
                className="group relative text-[11px] font-black uppercase tracking-[0.2em] transition-opacity hover:opacity-100 opacity-70"
              >
                {item}
                <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-[#C5A021] transition-all group-hover:w-full" />
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-6 sm:gap-10">
          <div className="hidden items-center gap-4 border-b border-white/20 pb-1 sm:flex lg:w-64">
            <Search className="h-4 w-4 opacity-50" />
            <input 
              type="text" 
              placeholder="SEARCH" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              className="w-full bg-transparent text-[11px] font-bold tracking-widest text-white outline-none placeholder:text-white/30"
            />
          </div>
          <User className="h-5 w-5 cursor-pointer hover:text-[#C5A021] transition-colors" />
          <button className="relative group" onClick={() => setIsCartOpen(true)}>
            <ShoppingCart className="h-5 w-5 cursor-pointer group-hover:text-[#C5A021] transition-colors" />
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center bg-[#C5A021] text-[9px] font-black text-[#0A0A0A] rounded-full">
                {cartCount}
              </span>
            )}
          </button>
          <button className="lg:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-6 w-6 text-[#C5A021]" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute left-0 right-0 top-full bg-[#0A0A0A] border-b border-white/10 p-6 lg:hidden"
          >
            <div className="flex flex-col gap-6">
              {navItems.map((item) => (
                <Link 
                  key={item} 
                  href={`/shop/${item.toLowerCase()}`} 
                  onClick={() => setIsMenuOpen(false)}
                  className="text-lg font-black uppercase tracking-[0.3em] hover:text-[#C5A021]"
                >
                  {item}
                </Link>
              ))}
              <div className="flex items-center gap-4 border-b border-white/10 pb-4 mt-4">
                <Search className="h-4 w-4 opacity-50" />
                <input 
                  type="text" 
                  placeholder="SEARCH" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearch}
                  className="w-full bg-transparent text-sm font-bold tracking-widest text-white outline-none placeholder:text-white/30"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>

  );
}
