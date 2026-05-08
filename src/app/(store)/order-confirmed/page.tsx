"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

function OrderConfirmedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderRef = searchParams.get("ref");

  useEffect(() => {
    if (!orderRef) {
      router.replace("/shop");
    }
  }, [orderRef, router]);

  if (!orderRef) return null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center container mx-auto px-4 py-20 text-center mt-14 sm:mt-20">
      <CheckCircle2 className="h-24 w-24 text-[#C5A021] mb-8 animate-bounce" />
      <h1 className="text-4xl sm:text-6xl font-[900] uppercase tracking-tighter text-white mb-4">
        ORDER CONFIRMED.
      </h1>
      <p className="text-lg font-bold text-white/50 tracking-widest uppercase mb-2">
        Reference Number
      </p>
      <p className="text-3xl font-black text-[#C5A021] mb-12 bg-[#C5A021]/10 px-8 py-4 rounded-xl border border-[#C5A021]/20">
        {orderRef}
      </p>

      <p className="max-w-md text-white/70 font-medium leading-relaxed mb-8">
        Thank you for your order. We&apos;ve redirected you to WhatsApp to complete your payment with our team. If WhatsApp didn&apos;t open automatically, please reach out to us directly.
      </p>

      <Link
        href="/shop"
        className="border-2 border-[#C5A021] bg-transparent text-[#C5A021] hover:bg-[#C5A021] hover:text-black px-10 py-4 font-black uppercase tracking-[0.2em] transition-all flex justify-center items-center gap-2"
      >
        Continue Shopping
      </Link>
    </div>
  );
}

export default function OrderConfirmedPage() {
  return (
    <main className="flex min-h-screen flex-col bg-[#0A0A0A]">
      <Navbar />
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center mt-14 sm:mt-20">
          <div className="animate-spin h-10 w-10 rounded-full border-2 border-[#C5A021] border-t-transparent" />
        </div>
      }>
        <OrderConfirmedContent />
      </Suspense>
      <Footer />
    </main>
  );
}
