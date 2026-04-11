"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#0A0A0A] py-12 text-white sm:py-20">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-6">
            <h3 className="text-2xl font-black italic tracking-tighter">
              ON ACTIVE WEAR
            </h3>
            <p className="text-sm font-medium leading-relaxed tracking-wide">
              ELEVATING PERFORMANCE THROUGH MINIMALIST AESTHETIC.
              DESIGNED IN 2026.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-black uppercase tracking-widest">
              SHOP
            </h4>
            <ul className="space-y-2 text-sm font-bold">
              <li>
                <Link href="#" className="hover:underline">LEGGINGS</Link>
              </li>
              <li>
                <Link href="#" className="hover:underline">HOODIES</Link>
              </li>
              <li>
                <Link href="#" className="hover:underline">ACCESSORIES</Link>
              </li>
              <li>
                <Link href="#" className="hover:underline">NEW ARRIVALS</Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-black uppercase tracking-widest">
              HELP
            </h4>
            <ul className="space-y-2 text-sm font-bold">
              <li>
                <Link href="#" className="hover:underline">SHIPPING</Link>
              </li>
              <li>
                <Link href="#" className="hover:underline">RETURNS</Link>
              </li>
              <li>
                <Link href="#" className="hover:underline">CONTACT</Link>
              </li>
              <li>
                <Link href="#" className="hover:underline">FAQ</Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-black uppercase tracking-widest">
              NEWSLETTER
            </h4>
            <p className="text-xs font-medium uppercase tracking-wide">
              GET 15% OFF YOUR FIRST ORDER.
            </p>
            <div className="flex border-b border-white/20 py-2">
              <input
                type="email"
                placeholder="EMAIL ADDRESS"
                className="w-full bg-transparent text-xs font-bold uppercase outline-none placeholder:text-white/30"
              />
              <button>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col justify-between pt-8 text-[10px] font-bold uppercase tracking-widest sm:flex-row">
          <span>&copy; 2026 ON ACTIVE WEAR. ALL RIGHTS RESERVED.</span>
          <div className="mt-4 flex gap-6 sm:mt-0">
            <Link href="#">TERMS</Link>
            <Link href="#">PRIVACY</Link>
            <Link href="#">COOKIES</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
