"use client";

import { useState } from "react";
import { useCart } from "@/store/cart";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, Loader2, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const { items, clearCart, setIsCartOpen } = useCart();
  const cartTotal = items.reduce((total, item) => total + item.price_usd * item.quantity, 0);
  const [step, setStep] = useState<"form" | "processing" | "success">("form");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep("processing");
    
    try {
      const orderRef = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
      
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_ref: orderRef,
          items: items.map(item => ({
            productId: item.productId,
            name: item.name,
            price_usd: item.price_usd,
            size: item.size,
            quantity: item.quantity,
            image: item.image
          })),
          total_usd: cartTotal,
          delivery_fee_usd: 0
        })
      });

      const result = await res.json();
      if (result.error) {
        console.error("Order error:", result.error);
        alert(`Failed to submit order: ${result.error}`);
        setStep("form");
        return;
      }

      setStep("success");
      clearCart();
    } catch (err) {
      console.error(err);
      setStep("form");
    }
  };

  const handleClose = () => {
    if (step === "success") {
      setIsCartOpen(false); // Close the cart sidebar too
    }
    setStep("form");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-[#0A0A0A]/90 backdrop-blur-md"
            onClick={step === "processing" ? undefined : handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 z-[90] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 bg-[#111111] text-white p-6 md:p-10 shadow-2xl border border-white/5 rounded-2xl"
          >
            {step === "form" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="mb-8 flex items-center justify-between">
                  <h2 className="text-2xl font-[900] uppercase tracking-tighter">Guest Checkout</h2>
                  <button onClick={handleClose}>
                    <X className="h-6 w-6 transition-transform hover:scale-110 opacity-50 hover:opacity-100" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C5A021]">Shipping Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <input required type="text" placeholder="First Name" className="bg-[#1A1A1A] border border-white/5 p-4 rounded-xl text-sm outline-none focus:border-white transition-colors placeholder:text-white/20" />
                      <input required type="text" placeholder="Last Name" className="bg-[#1A1A1A] border border-white/5 p-4 rounded-xl text-sm outline-none focus:border-white transition-colors placeholder:text-white/20" />
                    </div>
                    <input required type="email" placeholder="Email Address" className="w-full bg-[#1A1A1A] border border-white/5 p-4 rounded-xl text-sm outline-none focus:border-white transition-colors placeholder:text-white/20" />
                    <input required type="text" placeholder="Shipping Address" className="w-full bg-[#1A1A1A] border border-white/5 p-4 rounded-xl text-sm outline-none focus:border-white transition-colors placeholder:text-white/20" />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C5A021]">Payment (Mock)</h3>
                    <input required type="text" placeholder="Card Number (e.g. 4242 4242)" className="w-full bg-[#1A1A1A] border border-white/5 p-4 rounded-xl text-sm outline-none focus:border-white transition-colors placeholder:text-white/20" />
                    <div className="grid grid-cols-2 gap-4">
                      <input required type="text" placeholder="MM/YY" className="bg-[#1A1A1A] border border-white/5 p-4 rounded-xl text-sm outline-none focus:border-white transition-colors placeholder:text-white/20" />
                      <input required type="text" placeholder="CVC" className="bg-[#1A1A1A] border border-white/5 p-4 rounded-xl text-sm outline-none focus:border-white transition-colors placeholder:text-white/20" />
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-6 mt-6 flex justify-between items-center text-xl font-black italic">
                    <span className="text-white/50">Total</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>

                  <button type="submit" className="w-full group relative overflow-hidden bg-white py-5 text-sm font-black uppercase tracking-[0.3em] text-[#0A0A0A] rounded-xl flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]">
                    <span className="relative z-10">Pay Now</span>
                    <ArrowRight className="h-4 w-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>
              </motion.div>
            )}

            {step === "processing" && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <Loader2 className="h-12 w-12 animate-spin text-white mb-6" />
                <h3 className="text-xl font-black uppercase tracking-widest text-[#C5A021]">Processing Payment...</h3>
                <p className="mt-2 text-xs font-bold uppercase tracking-widest text-white/50">Please do not close this window.</p>
              </motion.div>
            )}

            {step === "success" && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-10 text-center"
              >
                <CheckCircle className="h-20 w-20 text-[#C5A021] mb-6" />
                <h3 className="text-4xl font-[900] uppercase tracking-tighter mb-4 text-white">Order Confirmed!</h3>
                <p className="text-sm font-medium text-white/60 mb-8 max-w-sm">
                  Your mock payment was successful. We'll send a confirmation email with your order details shortly.
                </p>
                <button onClick={handleClose} className="w-full rounded-xl border border-white/20 bg-transparent py-4 text-xs font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-white/10">
                  Continue Shopping
                </button>
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
