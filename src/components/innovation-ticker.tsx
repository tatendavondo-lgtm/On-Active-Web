"use client";

import { motion } from "framer-motion";

const TEXT = "Innovation is not a feature. It is a baseline. We build for the extreme, so you can perform perfectly in the ordinary. The 2026 Collection.";

export function InnovationTicker() {
  return (
    <div className="relative flex overflow-hidden bg-[#0A0A0A] border-y border-white/5 py-12">
      <motion.div
        animate={{
          x: [0, -2000],
        }}
        transition={{
          duration: 40,
          repeat: Infinity,
          ease: "linear",
        }}
        className="flex whitespace-nowrap gap-20 items-center"
      >
        {[...Array(10)].map((_, i) => (
          <span 
            key={i} 
            className="text-4xl font-black italic uppercase sm:text-7xl text-white/20 hover:text-[#C5A021] transition-colors duration-500 tracking-normal"
          >
            {TEXT}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
