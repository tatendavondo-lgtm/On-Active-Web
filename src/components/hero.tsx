"use client";

import { useScroll, useTransform, motion } from "framer-motion";
import { useRef } from "react";
import { ScrambleText } from "./scramble-text";
import { Magnetic } from "./magnetic";

export function Hero() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  // 3D Depth Transforms
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.5]);
  const z = useTransform(scrollYProgress, [0, 1], ["0px", "-500px"]);
  const rotateX = useTransform(scrollYProgress, [0, 1], [0, 15]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const yText = useTransform(scrollYProgress, [0, 1], ["0%", "-150%"]);

  return (
    <section 
      ref={containerRef} 
      className="relative h-[150vh] w-full bg-background text-white"
    >
      <div className="sticky top-0 h-[100vh] w-full overflow-hidden" style={{ perspective: "1000px" }}>
        
        {/* Deep 3D Background */}
        <motion.div 
          style={{ scale, z, rotateX, opacity }} 
          className="absolute inset-0 z-0 origin-bottom flex items-center justify-center bg-background"
        >
          <video
            src="/videos/hero.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </motion.div>

        {/* Foreground Cinematic Elements */}
        <div className="container relative z-10 mx-auto flex h-full flex-col justify-center px-4 sm:px-10">
          <motion.div 
            style={{ y: yText }} 
            className="max-w-5xl space-y-8 pt-20"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, z: 100 }}
              animate={{ opacity: 1, scale: 1, z: 0 }}
              transition={{ duration: 1.5, delay: 2, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <h1 className="flex flex-col text-[12vw] font-[900] leading-[0.8] tracking-tighter md:text-[10vw]">
                <ScrambleText text="OWN IT." duration={1} delay={2.5} />
                <motion.div 
                  initial={{ rotateX: 90, opacity: 0 }}
                  animate={{ rotateX: 0, opacity: 1 }}
                  transition={{ duration: 1, delay: 3.1 }}
                  className="outline-text-white text-transparent origin-bottom"
                >
                  <ScrambleText text="WEAR IT." duration={1} delay={3.1} />
                </motion.div>
                <div className="mt-4 flex w-fit bg-white px-4 py-2 text-black shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                  <ScrambleText text="FEEL IT." duration={1} delay={3.7} />
                </div>
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 4.5 }}
              className="flex flex-col gap-10 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="max-w-md text-sm font-bold uppercase tracking-[0.3em] leading-relaxed opacity-80 sm:text-lg">
                High-performance apparel designed for those who never compromise. 
                The 2026 Active Collection is here.
              </p>
              
              <div className="flex gap-6">
                <Magnetic>
                  <button 
                    onClick={() => document.getElementById("trending-now")?.scrollIntoView({ behavior: "smooth" })}
                    className="group relative overflow-hidden bg-white px-12 py-5 text-[11px] font-black uppercase tracking-[0.3em] text-background shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-transform hover:scale-105"
                  >
                    <span className="relative z-10 block transition-transform duration-300 group-hover:-translate-y-10">Shop Collection</span>
                    <span className="absolute left-0 right-0 top-full z-10 flex h-full items-center justify-center transition-transform duration-300 group-hover:-translate-y-full">
                      ENTER 2026
                    </span>
                    <div className="absolute inset-0 bg-white" />
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


