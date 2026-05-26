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
  const [paymentMethod, setPaymentMethod] = useState<"card" | "ecocash" | "bank">("ecocash");
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [errors, setErrors] = useState({ name: "", phone: "", address: "" });

  const cartSubtotal = items.reduce((sum, item) => sum + (item.price_usd * item.quantity), 0);
  const deliveryFee = cartSubtotal > 50 || cartSubtotal === 0 ? 0 : 5;
  const cartTotal = cartSubtotal + deliveryFee;

  const validate = () => {
    let valid = true;
    const newErrors = { name: "", phone: "", address: "" };

    if (!form.name.trim()) {
      newErrors.name = "Name is required";
      valid = false;
    }
    if (!form.phone.trim()) {
      newErrors.phone = "Phone number is required";
      valid = false;
    }
    if (!form.address.trim()) {
      newErrors.address = "Delivery address is required";
      valid = false;
    }

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
        variantId: i.variantId,
        name: i.name,
        price: i.price_usd,
        size: i.size,
        color: i.color,
        quantity: i.quantity,
        image: i.image
      })),
      total_usd: cartTotal,
      delivery_fee_usd: deliveryFee,
      payment_method: paymentMethod
    };

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error("Failed to place order.");
      
      // WhatsApp message based on method
      let methodText = paymentMethod === 'ecocash' ? 'EcoCash' : paymentMethod === 'bank' ? 'Bank Transfer' : 'Card/Swipe';
      const msg = `Hi On Active! 👋\n\nI want to place an order: ${orderRef}\n*Name*: ${form.name}\n*Method*: ${methodText}\n*Total*: $${cartTotal.toFixed(2)}`;
      const waUrl = `https://wa.me/${settings.whatsapp_number.replace(/\+/g, '')}?text=${encodeURIComponent(msg)}`;
      window.open(waUrl, '_blank');
      
      clearCart();
      router.push(`/order-confirmed?ref=${orderRef}`);
    } catch (err: any) {
      toast.error("Something went wrong. Please try again.");
      console.error(err);
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
        <div className="space-y-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#C5A021]">1. Shipping Details</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Full Name</label>
                <input 
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  className={`w-full bg-[#111111] border p-4 text-white placeholder-white/30 outline-none transition-colors rounded-xl ${errors.name ? 'border-red-500' : 'border-white/5 focus:border-[#C5A021]'}`}
                  placeholder="YOUR NAME"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1 font-bold">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Phone Number</label>
                <input 
                  value={form.phone}
                  onChange={e => setForm({...form, phone: e.target.value})}
                  className={`w-full bg-[#111111] border p-4 text-white placeholder-white/30 outline-none transition-colors rounded-xl ${errors.phone ? 'border-red-500' : 'border-white/5 focus:border-[#C5A021]'}`}
                  placeholder="07XX XXX XXX"
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1 font-bold">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Delivery Address</label>
                <textarea 
                  value={form.address}
                  onChange={e => setForm({...form, address: e.target.value})}
                  className={`w-full h-32 bg-[#111111] border p-4 text-white placeholder-white/30 outline-none transition-colors rounded-xl resize-none ${errors.address ? 'border-red-500' : 'border-white/5 focus:border-[#C5A021]'}`}
                  placeholder="FULL ADDRESS"
                />
                {errors.address && <p className="text-red-500 text-xs mt-1 font-bold">{errors.address}</p>}
              </div>
            </div>

            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#C5A021] pt-4">2. Payment Method</h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'ecocash', label: 'EcoCash' },
                { id: 'bank', label: 'Transfer' },
                { id: 'card', label: 'Card' }
              ].map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id as any)}
                  className={`py-4 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                    paymentMethod === method.id 
                      ? 'bg-[#C5A021] border-[#C5A021] text-black' 
                      : 'bg-[#111] border-white/5 text-white/40 hover:border-white/20'
                  }`}
                >
                  {method.label}
                </button>
              ))}
            </div>

            <div className="bg-[#111] p-6 rounded-xl border border-white/5">
              {paymentMethod === 'ecocash' && (
                <div className="space-y-2">
                  <p className="text-xs font-black text-white uppercase tracking-widest">Dial: *151*1*1*0777123456*Amount#</p>
                  <p className="text-[10px] text-white/40 font-medium">Reference: Use your Order Number.</p>
                </div>
              )}
              {paymentMethod === 'bank' && (
                <div className="space-y-2">
                  <p className="text-xs font-black text-white uppercase tracking-widest">CABS: 1234567890 (On Active)</p>
                  <p className="text-[10px] text-white/40 font-medium">Please send your POP to WhatsApp.</p>
                </div>
              )}
              {paymentMethod === 'card' && (
                <div className="space-y-2">
                  <p className="text-xs font-black text-white uppercase tracking-widest">Swipe at Pickup</p>
                  <p className="text-[10px] text-white/40 font-medium">Pay via swipe when you pick up your items.</p>
                </div>
              )}
            </div>
            
            <button
              disabled={loading}
              type="submit"
              className="w-full flex items-center justify-center bg-white text-black py-6 text-sm font-black uppercase tracking-[0.3em] hover:bg-[#C5A021] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-xl mt-4"
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
