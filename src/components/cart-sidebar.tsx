"use client";

import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import Image from "next/image";
import { useCart } from "@/store/cart";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export function CartSidebar() {
  const { isCartOpen, setIsCartOpen, items, updateQuantity, removeItem } = useCart();
  const router = useRouter();
  
  const cartTotal = items.reduce((total, item) => total + item.price_usd * item.quantity, 0);

  return (
    <>
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 right-0 top-0 z-[70] flex w-full max-w-sm flex-col bg-[#111111] text-white shadow-2xl border-l border-white/5"
            >
              <div className="flex items-center justify-between border-b border-white/10 p-6">
                <h2 className="text-xl font-[900] tracking-tighter">YOUR BAG</h2>
                <button onClick={() => setIsCartOpen(false)}>
                  <X className="h-6 w-6 transition-transform hover:scale-110" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                {items.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center space-y-4 text-center opacity-50">
                    <ShoppingBag className="h-12 w-12" />
                    <p className="font-bold uppercase tracking-widest">Your bag is empty.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {items.map((item) => {
                      const itemKey = `${item.productId}-${item.size}-${item.color || ''}`;
                      return (
                      <div key={itemKey} className="flex gap-4">
                        <div className="relative h-24 w-20 flex-shrink-0 bg-[#0A0A0A] border border-white/5 rounded-md overflow-hidden flex items-center justify-center">
                          {item.image && item.image !== "/images/placeholder.jpg" ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <span className="text-[9px] font-black italic tracking-tighter text-white/20 uppercase">
                              ON ACTIVE
                            </span>
                          )}
                        </div>
                        <div className="flex flex-1 flex-col justify-between">
                          <div>
                            <div className="flex justify-between">
                              <h3 className="text-xs font-black uppercase text-white/90">{item.name}</h3>
                              <button onClick={() => removeItem(itemKey)}>
                                <X className="h-4 w-4 opacity-50 hover:opacity-100" />
                              </button>
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#C5A021]">Size: {item.size} {item.color && `| Color: ${item.color}`}</p>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center border border-white/20 rounded-sm">
                              <button 
                                onClick={() => updateQuantity(itemKey, item.quantity - 1)}
                                className="px-2 py-1 hover:bg-white/10 transition-colors"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="px-2 text-xs font-bold">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(itemKey, item.quantity + 1)}
                                className="px-2 py-1 hover:bg-white/10 transition-colors"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                            <p className="text-sm font-black italic">${(item.price_usd * item.quantity).toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="border-t border-white/10 p-6 bg-[#0A0A0A]">
                <div className="mb-4 flex items-center justify-between text-lg font-black uppercase">
                  <span>Total</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <button 
                  disabled={items.length === 0}
                  onClick={() => {
                    setIsCartOpen(false);
                    router.push('/checkout');
                  }}
                  className="w-full bg-white py-4 text-xs font-black uppercase tracking-[0.2em] text-[#0A0A0A] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30"
                >
                  Checkout
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
