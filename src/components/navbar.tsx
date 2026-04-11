"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Menu, Search, User } from "lucide-react";
import { useCart } from "@/store/cart-context";

export function Navbar() {
  const { cartCount, setIsCartOpen, isMounted } = useCart();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/70 text-white backdrop-blur-xl">
      <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:h-20 sm:px-10">
        <div className="flex items-center gap-12">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-white/20">
              <Image 
                src="/images/logo.jpg" 
                alt="On Active Wear" 
                fill 
                className="object-cover"
              />
            </div>
            <span className="text-2xl font-[900] tracking-tighter sm:text-3xl">
              ON ACTIVE WEAR.
            </span>
          </Link>
          
          <div className="hidden items-center gap-8 lg:flex">
            {["Men", "Women", "Accessories", "Collections"].map((item) => (
              <Link 
                key={item} 
                href={`/shop/${item.toLowerCase()}`} 
                className="group relative text-[13px] font-black uppercase tracking-[0.2em] transition-opacity hover:opacity-100 opacity-70"
              >
                {item}
                <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-white transition-all group-hover:w-full" />
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
              className="w-full bg-transparent text-[11px] font-bold tracking-widest text-white outline-none placeholder:text-white/30"
            />
          </div>
          <User className="h-5 w-5 cursor-pointer hover:opacity-70 transition-opacity" />
          <button className="relative group" onClick={() => setIsCartOpen(true)}>
            <ShoppingCart className="h-5 w-5 cursor-pointer group-hover:opacity-70 transition-opacity" />
            {isMounted && cartCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center bg-white text-[9px] font-black text-background rounded-full">
                {cartCount}
              </span>
            )}
          </button>
          <button className="lg:hidden">
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>
    </nav>
  );
}
