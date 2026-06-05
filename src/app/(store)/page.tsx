"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Phone, Check, ArrowRight } from "lucide-react";
import { toast } from "react-hot-toast";

export default function ComingSoonPage() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail("");
    toast.success("Welcome to the inner circle. We will notify you on launch! 🔥", {
      position: "bottom-center",
      style: {
        background: "#111111",
        color: "#C5A021",
        border: "1px solid rgba(197, 160, 33, 0.2)",
        fontSize: "12px",
        fontWeight: "bold",
      }
    });
  };

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white flex flex-col justify-between relative overflow-hidden">
      
      {/* Background Graphic Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111111_1px,transparent_1px),linear-gradient(to_bottom,#111111_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 z-0" />

      {/* Header Logo */}
      <header className="container mx-auto px-6 py-8 sm:px-10 z-10 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="relative h-8 w-8 overflow-hidden rounded-full border border-white/20">
            <Image 
              src="/images/logo.jpg" 
              alt="On Active Wear Logo" 
              fill 
              className="object-cover"
            />
          </div>
          <span className="text-xl font-[900] tracking-tighter sm:text-2xl">
            ON <span className="text-[#C5A021]">ACTIVE</span>.
          </span>
        </div>
        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30">
          ARCHIVE 2026
        </span>
      </header>

      {/* Main Content */}
      <section className="container mx-auto px-6 py-12 sm:px-10 z-10 flex flex-col justify-center items-center text-center flex-1 max-w-4xl space-y-12">
        
        {/* Release Status Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 border border-[#C5A021]/30 bg-[#C5A021]/5 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.3em] text-[#C5A021]"
        >
          <span className="h-1.5 w-1.5 bg-[#C5A021] rounded-full animate-ping" />
          Webstore Under Construction
        </motion.div>

        {/* Hero Headlines */}
        <div className="space-y-6">
          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-5xl sm:text-8xl font-[900] uppercase tracking-tighter leading-[0.85] text-white"
          >
            THE EVOLUTION <br /> IS <span className="text-white/20">COMING.</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="max-w-2xl mx-auto text-sm sm:text-base text-white/60 font-medium leading-relaxed tracking-wide"
          >
            We are uploading inventory and configuring our automated delivery matrices. Activewear engineered for extremes, dispatched directly to your exact coordinates.
          </motion.p>
        </div>

        {/* Feature Cards Grid (Distance logic info) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full text-left pt-6"
        >
          <div className="bg-[#111111]/60 border border-white/5 p-6 rounded-2xl backdrop-blur-md">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#C5A021]">01 / SECURED ORDERS</span>
            <h4 className="text-sm font-black uppercase text-white mt-2 mb-1">WhatsApp Checkout</h4>
            <p className="text-[11px] text-white/50 leading-relaxed font-medium">Verify POP and coordinate directly with our team over WhatsApp for frictionless Harare dispatch.</p>
          </div>

          <div className="bg-[#111111]/60 border border-white/5 p-6 rounded-2xl backdrop-blur-md">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#C5A021]">02 / DELIVERIES</span>
            <h4 className="text-sm font-black uppercase text-white mt-2 mb-1">GPS-Tracked Dispatch</h4>
            <p className="text-[11px] text-white/50 leading-relaxed font-medium">Pin your precise coordinates at checkout to automatically calculate dynamic rates based on distance.</p>
          </div>

          <div className="bg-[#111111]/60 border border-white/5 p-6 rounded-2xl backdrop-blur-md">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#C5A021]">03 / COLLECTION</span>
            <h4 className="text-sm font-black uppercase text-white mt-2 mb-1">Harare Warehouse</h4>
            <p className="text-[11px] text-white/50 leading-relaxed font-medium">Collect directly from our main branch at 24 Van Praagh Ave, Harare for zero additional cost.</p>
          </div>
        </motion.div>

        {/* Email Newsletter Input */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="w-full max-w-md"
        >
          {subscribed ? (
            <div className="flex items-center justify-center gap-2 text-[#C5A021] text-xs font-black uppercase tracking-widest bg-[#C5A021]/5 border border-[#C5A021]/20 py-4 rounded-xl">
              <Check size={14} strokeWidth={3} />
              You're in. We'll notify you on launch.
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ENTER YOUR EMAIL FOR EARLY ACCESS"
                className="flex-1 bg-[#111]/80 border border-white/10 focus:border-[#C5A021] px-5 py-4 text-white outline-none transition-colors text-xs font-bold uppercase tracking-widest rounded-xl"
              />
              <button 
                type="submit"
                className="bg-white text-black font-black px-8 py-4 text-xs uppercase tracking-widest hover:bg-[#C5A021] hover:text-black transition-all rounded-xl hover:scale-[1.02] active:scale-95 duration-300"
              >
                NOTIFY ME
              </button>
            </form>
          )}
        </motion.div>
        
        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-wrap gap-4 justify-center"
        >
          <a
            href="https://wa.me/263782610691"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 border border-white/10 px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:border-[#C5A021] hover:text-[#C5A021] transition-all bg-[#0A0A0A]/50"
          >
            <Phone size={12} className="text-[#C5A021]" />
            TALK TO TEAM (WHATSAPP)
          </a>
        </motion.div>

      </section>

      {/* Footer Socials */}
      <footer className="container mx-auto px-6 py-8 sm:px-10 z-10 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">
        <span>&copy; 2026 ON ACTIVE WEAR. ALL RIGHTS RESERVED.</span>
        
        {/* Social Icons */}
        <div className="flex gap-4">
          <a 
            href="https://www.instagram.com/on_active_wear.zw?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="p-2 bg-white/5 hover:bg-white/10 text-white/50 hover:text-[#C5A021] rounded-full transition-all"
            title="Instagram"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-instagram"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
          </a>
          <a 
            href="https://www.facebook.com/share/1AiApBzHVr/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="p-2 bg-white/5 hover:bg-white/10 text-white/50 hover:text-[#C5A021] rounded-full transition-all"
            title="Facebook"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-facebook"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
          </a>
        </div>
      </footer>
    </main>
  );
}
