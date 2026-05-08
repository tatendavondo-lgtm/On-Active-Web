"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ScrambleText } from "./scramble-text";
import { Magnetic } from "./magnetic";

export function Hero() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const yText = useTransform(scrollYProgress, [0, 1], [0, 400]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);
  const z = useTransform(scrollYProgress, [0, 1], [0, -500]);
  const rotateX = useTransform(scrollYProgress, [0, 1], [0, 20]);

  return (
    <section 
      ref={containerRef} 
      className="relative flex h-[110vh] w-full items-center justify-center overflow-hidden bg-[#0A0A0A] perspective-1000"
    >
      <div className="relative h-full w-full">
        {/* Deep 3D Background */}
        <motion.div 
          style={{ scale, z, rotateX, opacity }} 
          className="absolute inset-0 z-0 origin-bottom flex items-center justify-center bg-[#0A0A0A]"
        >
          <video
            src="/videos/hero.mp4"
            autoPlay
            loop
            muted
            playsInline
            onError={(e) => {
              const target = e.target as HTMLVideoElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                const img = document.createElement('img');
                img.src = '/images/products/TGIS 100.jpg';
                img.className = 'absolute inset-0 h-full w-full object-cover opacity-60 hero-bg';
                parent.appendChild(img);
              }
            }}
            className="absolute inset-0 h-full w-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/60 to-transparent" />
        </motion.div>

        {/* Foreground Cinematic Elements */}
        <div className="container relative z-10 mx-auto flex h-full flex-col justify-center px-4 sm:px-10">
          <motion.div 
            style={{ y: yText }} 
            className="max-w-5xl space-y-12 pt-20"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, z: 100 }}
              animate={{ opacity: 1, scale: 1, z: 0 }}
              transition={{ duration: 1.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <h1 className="flex flex-col text-[12vw] font-[900] leading-[0.8] tracking-tighter md:text-[10vw]">
                <ScrambleText text="OWN IT." duration={1} delay={1} />
                <motion.div 
                   initial={{ rotateX: 90, opacity: 0 }}
                   animate={{ rotateX: 0, opacity: 1 }}
                   transition={{ duration: 1, delay: 1.5 }}
                   className="outline-text-white text-transparent origin-bottom"
                >
                  <ScrambleText text="WEAR IT." duration={1} delay={1.5} />
                </motion.div>
                <div className="mt-4 flex w-fit bg-white px-4 py-2 text-black shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                  <ScrambleText text="FEEL IT." duration={1} delay={2} />
                </div>
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 2.5 }}
              className="flex flex-col gap-10 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="max-w-xl text-sm font-bold uppercase tracking-[0.3em] leading-relaxed opacity-80 sm:text-lg text-balance">
                High-performance apparel designed for those who never compromise. 
                The 2026 Active Collection is here.
              </p>
              
              <div className="flex gap-6">
                <Magnetic>
                  <button 
                    onClick={() => document.getElementById("trending-now")?.scrollIntoView({ behavior: "smooth" })}
                    className="group relative overflow-hidden bg-[#C5A021] px-8 py-4 text-[12px] font-bold uppercase tracking-widest text-black shadow-[0_0_50px_rgba(197,160,33,0.3)] transition-all hover:scale-105 active:scale-95 duration-300"
                  >
                    <span className="relative z-10 block">Shop Collection</span>
                    <div className="absolute inset-0 bg-white/20 translate-y-full transition-transform duration-300 group-hover:translate-y-0" />
                  </button>
                </Magnetic>
              </div>
            </motion.div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
