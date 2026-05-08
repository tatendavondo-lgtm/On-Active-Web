"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Preloader() {
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const hasSeenPreloader = sessionStorage.getItem('on-active-loaded');
    if (hasSeenPreloader) {
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsLoading(false);
      sessionStorage.setItem('on-active-loaded', 'true');
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const handleSkip = () => {
    setIsLoading(false);
    sessionStorage.setItem('on-active-loaded', 'true');
  };

  if (!mounted) return null;

  return (
    <AnimatePresence mode="wait">
      {isLoading && (
        <motion.div
          key="preloader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          onClick={handleSkip}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0A0A0A] cursor-pointer"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col items-center gap-4"
          >
            <h1 className="text-4xl font-[900] tracking-[0.4em] uppercase text-[#C5A021] sm:text-6xl">
              ON ACTIVE.
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-white/20">
              CLICK TO SKIP
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
