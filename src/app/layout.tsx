import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { CartProvider } from "@/store/cart-context";
import { CartSidebar } from "@/components/cart-sidebar";

import { Preloader } from "@/components/preloader";
import { CustomCursor } from "@/components/custom-cursor";
// import { SmoothScroll } from "@/components/smooth-scroll";

export const metadata: Metadata = {
  title: "On Active Wear | Premium Fitness Apparel",
  description: "Own It, Wear It, Feel It. High-performance fitness apparel for the active mind.",
  manifest: "/manifest.json",
  icons: {
    icon: "/images/logo.jpg",
    apple: "/images/logo.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col cursor-none">
        {/* <SmoothScroll> */}
          <Preloader />
          <CustomCursor />
          <CartProvider>
            {children}
            <CartSidebar />
          </CartProvider>
        {/* </SmoothScroll> */}
      </body>
    </html>
  );
}


