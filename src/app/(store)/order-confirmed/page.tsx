"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, MessageCircle, Package, ArrowRight, Clock } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

interface OrderReceipt {
  orderRef: string;
  waUrl?: string;
  status?: string;
  fulfillment?: string;
  customerName?: string | null;
  items: Array<{
    name: string;
    size?: string;
    color?: string;
    quantity: number;
    price?: number;
    price_usd?: number;
  }>;
  subtotal: number;
  deliveryFee: number;
  total: number;
}

function OrderConfirmedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderRef = searchParams.get("ref");
  const [receipt, setReceipt] = useState<OrderReceipt | null>(null);

  useEffect(() => {
    if (!orderRef) {
      router.replace("/shop");
      return;
    }

    // 1. Load cached checkout details from sessionStorage (includes exact pre-built WhatsApp link)
    let cachedWaUrl: string | undefined;
    try {
      const cached = sessionStorage.getItem(`on_active_order_${orderRef}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        cachedWaUrl = parsed.waUrl;
        setReceipt({
          orderRef: parsed.orderRef,
          waUrl: parsed.waUrl,
          status: "pending",
          customerName: parsed.customerName,
          items: parsed.items || [],
          subtotal: Number(parsed.subtotal || 0),
          deliveryFee: Number(parsed.deliveryFee || 0),
          total: Number(parsed.total || 0),
        });
      }
    } catch {}

    // 2. Fetch live order status & fallback receipt from API
    fetch(`/api/orders/${encodeURIComponent(orderRef)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.order) {
          const o = data.order;
          const total = Number(o.total_usd || 0);
          const deliveryFee = Number(o.delivery_fee_usd || 0);
          const subtotal = Math.max(0, total - deliveryFee);

          let fallbackWaUrl = cachedWaUrl;
          if (!fallbackWaUrl && o.whatsapp_number) {
            const msg = `Hi On Active! 👋\n\nI placed order *${o.order_ref}* (Total: $${total.toFixed(2)}) and would like to complete my payment.`;
            fallbackWaUrl = `https://wa.me/${String(o.whatsapp_number).replace(/\+/g, "")}?text=${encodeURIComponent(msg)}`;
          }

          setReceipt((prev) => ({
            orderRef: o.order_ref,
            waUrl: prev?.waUrl || fallbackWaUrl,
            status: o.status || "pending",
            fulfillment: o.fulfillment,
            customerName: o.customer_name || prev?.customerName,
            items: o.items?.length ? o.items : prev?.items || [],
            subtotal,
            deliveryFee,
            total,
          }));
        }
      })
      .catch(() => {});
  }, [orderRef, router]);

  if (!orderRef) return null;

  const statusLabel = (receipt?.status || "pending").replace(/_/g, " ").toUpperCase();

  return (
    <div className="flex-1 flex flex-col items-center justify-center container mx-auto px-4 py-16 text-center mt-14 sm:mt-20 max-w-2xl">
      <CheckCircle2 className="h-20 w-20 text-[#C5A021] mb-6 animate-bounce" />
      <h1 className="text-4xl sm:text-6xl font-[900] uppercase tracking-tighter text-white mb-3">
        ORDER RECEIVED.
      </h1>
      <p className="text-xs font-bold text-white/50 tracking-[0.25em] uppercase mb-3">
        Reference Number
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-3 mb-8">
        <p className="text-2xl sm:text-3xl font-black text-[#C5A021] bg-[#C5A021]/10 px-8 py-3.5 rounded-xl border border-[#C5A021]/20 font-mono">
          {orderRef}
        </p>
        <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/80">
          <Clock size={12} className="text-[#C5A021]" />
          Status: {statusLabel}
        </span>
      </div>

      <p className="max-w-md text-white/70 text-sm font-medium leading-relaxed mb-8">
        Thank you{receipt?.customerName ? `, ${receipt.customerName}` : ""}! Complete your payment with our team on WhatsApp using your order reference. If WhatsApp didn&apos;t open automatically, tap the button below:
      </p>

      {/* Primary WhatsApp CTA (Popup-blocker safe) */}
      {receipt?.waUrl && (
        <a
          href={receipt.waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto mb-8 bg-[#25D366] hover:bg-[#20bd5a] text-black px-10 py-4 rounded-xl font-black uppercase tracking-[0.2em] text-xs transition-all flex justify-center items-center gap-3 shadow-lg"
        >
          <MessageCircle size={18} />
          Send Order on WhatsApp
          <ArrowRight size={15} />
        </a>
      )}

      {/* Itemized Receipt Summary */}
      {receipt && receipt.items.length > 0 && (
        <div className="w-full bg-[#111111] border border-white/10 rounded-2xl p-6 mb-10 text-left space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-[#C5A021] flex items-center gap-2">
              <Package size={14} /> Order Summary
            </span>
            {receipt.fulfillment && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                {receipt.fulfillment === "collection" ? "Store Collection" : "Door Delivery"}
              </span>
            )}
          </div>

          <div className="space-y-3">
            {receipt.items.map((item, idx) => {
              const unitPrice = Number(item.price_usd ?? item.price ?? 0);
              return (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-white uppercase">{item.name}</p>
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">
                      {item.size ? `Size: ${item.size}` : ""}{item.color ? ` · ${item.color}` : ""} · Qty: {item.quantity}
                    </p>
                  </div>
                  <p className="font-black text-white font-mono">
                    ${(unitPrice * item.quantity).toFixed(2)}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="border-t border-white/10 pt-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-white/50 font-bold uppercase tracking-wider">
              <span>Subtotal</span>
              <span>${receipt.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-white/50 font-bold uppercase tracking-wider">
              <span>Delivery</span>
              <span>{receipt.deliveryFee === 0 ? "FREE" : `$${receipt.deliveryFee.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between text-white font-black text-base pt-2 border-t border-white/10">
              <span className="uppercase tracking-widest">Total</span>
              <span className="text-[#C5A021] font-mono">${receipt.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      <Link
        href="/shop"
        className="border-2 border-[#C5A021] bg-transparent text-[#C5A021] hover:bg-[#C5A021] hover:text-black px-10 py-4 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all flex justify-center items-center gap-2"
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
