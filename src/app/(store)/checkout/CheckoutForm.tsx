"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useCart } from "@/store/cart";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

export function CheckoutForm({ settings }: { settings: any }) {
  const { items, clearCart } = useCart();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [errors, setErrors] = useState({ name: "", phone: "", address: "" });

  const cartSubtotal = items.reduce((total, item) => total + item.price_usd * item.quantity, 0);
  const deliveryFee = cartSubtotal >= settings.free_delivery_threshold_usd ? 0 : settings.delivery_fee_usd;
  const cartTotal = cartSubtotal + deliveryFee;

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;
  
  if (items.length === 0) {
    if (typeof window !== "undefined") router.replace("/shop");
    return null;
  }

  const validate = () => {
    let valid = true;
    const newErrors = { name: "", phone: "", address: "" };

    if (!form.name.trim()) { newErrors.name = "Name is required"; valid = false; }
    if (!form.address.trim()) { newErrors.address = "Address is required"; valid = false; }
    
    const phoneClean = form.phone.replace(/\s+/g, '');
    const isZimPhone = /^(07|\+2637)\d{7,8}$/.test(phoneClean);
    if (!isZimPhone) { newErrors.phone = "Invalid Zim phone (e.g. 07... or +263...)"; valid = false; }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    const orderRef = 'OA-' + Math.floor(1000 + Math.random() * 9000);

    const payload = {
      order_ref: orderRef,
      items: items.map(i => ({
        productId: i.productId,
        name: i.name,
        price: i.price_usd,
        size: i.size,
        quantity: i.quantity,
        image: i.image
      })),
      total_usd: cartTotal,
      delivery_fee_usd: deliveryFee
    };

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error("Failed to place order.");
      
      // Open WhatsApp
      const msg = `Hi On Active! 👋\n\nI want to place an order: ${orderRef}\n*Name*: ${form.name}\n*Total*: $${cartTotal.toFixed(2)}`;
      const waUrl = `https://wa.me/${settings.whatsapp_number.replace(/\+/g, '')}?text=${encodeURIComponent(msg)}`;
      window.open(waUrl, '_blank');
      
      clearCart();
      router.push(`/order-confirmed?ref=${orderRef}`);
    } catch (err: any) {
      toast.error("Something went wrong. Please try again.");
      console.error(err);
      
      // Fallback WA
      const msg = `Hi On Active! 👋\n\nOrder ref: ${orderRef}\nName: ${form.name}\nTotal: $${cartTotal.toFixed(2)}`;
      const waUrl = `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(msg)}`;
      window.open(waUrl, '_blank');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 sm:py-16 sm:px-10 max-w-6xl">
      <h1 className="text-3xl font-[900] uppercase tracking-tighter text-white sm:text-5xl border-b border-white/10 pb-8 mb-8">
        SECURE CHECKOUT
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Form */}
        <div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Full Name</label>
              <input 
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                className={`w-full bg-[#111111] border p-4 text-white placeholder-white/30 outline-none transition-colors ${errors.name ? 'border-red-500' : 'border-white/10 focus:border-[#C5A021]'}`}
                placeholder="YOUR NAME"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1 font-bold">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Phone Number</label>
              <input 
                value={form.phone}
                onChange={e => setForm({...form, phone: e.target.value})}
                className={`w-full bg-[#111111] border p-4 text-white placeholder-white/30 outline-none transition-colors ${errors.phone ? 'border-red-500' : 'border-white/10 focus:border-[#C5A021]'}`}
                placeholder="07XX XXX XXX"
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1 font-bold">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Delivery Address</label>
              <textarea 
                value={form.address}
                onChange={e => setForm({...form, address: e.target.value})}
                className={`w-full h-32 bg-[#111111] border p-4 text-white placeholder-white/30 outline-none transition-colors resize-none ${errors.address ? 'border-red-500' : 'border-white/10 focus:border-[#C5A021]'}`}
                placeholder="FULL ADDRESS"
              />
              {errors.address && <p className="text-red-500 text-xs mt-1 font-bold">{errors.address}</p>}
            </div>
            
            <button
              disabled={loading}
              type="submit"
              className="w-full flex items-center justify-center bg-white text-black py-5 text-sm font-black uppercase tracking-[0.3em] hover:bg-[#C5A021] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "COMPLETE ORDER"}
            </button>
          </form>
        </div>

        {/* Summary */}
        <div className="bg-[#111111] p-8 border border-white/5 h-fit">
          <h2 className="text-xl font-black uppercase tracking-widest text-white mb-6">Order Summary</h2>
          <div className="space-y-4 mb-6">
            {items.map(item => (
              <div key={`${item.productId}-${item.size}`} className="flex gap-4">
                <div className="relative h-16 w-12 bg-black border border-white/5">
                  <Image src={item.image} alt={item.name} fill className="object-cover" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xs uppercase font-bold text-white/90">{item.name}</h3>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-[#C5A021]">Size: {item.size} x{item.quantity}</p>
                </div>
                <p className="text-sm font-black text-white italic">${(item.price_usd * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 pt-6 space-y-4">
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-white/50">
              <span>Subtotal</span>
              <span>${cartSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-white/50">
              <span>Delivery</span>
              <span>{deliveryFee === 0 ? 'FREE' : `$${deliveryFee.toFixed(2)}`}</span>
            </div>
            
            <div className="pt-4 border-t border-white/10 flex flex-col items-end">
              <div className="flex justify-between items-end w-full mb-1">
                <span className="text-lg font-black uppercase tracking-widest text-white">Total</span>
                <span className="text-2xl font-black italic text-white">${cartTotal.toFixed(2)}</span>
              </div>
              <span className="text-xs font-black uppercase tracking-[0.2em] text-[#C5A021]">
                {(cartTotal * settings.zig_rate).toFixed(0)} ZiG
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
