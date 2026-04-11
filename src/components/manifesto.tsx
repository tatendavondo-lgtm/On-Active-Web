"use client";

import { useRef } from "react";
import { useScroll, useTransform, motion } from "framer-motion";

const WORDS = "Innovation is not a feature. It is a baseline. We build for the extreme, so you can perform perfectly in the ordinary. The 2026 Collection.".split(" ");

function ManifestoWord({ word, index, total, scrollYProgress }: { word: string; index: number; total: number; scrollYProgress: ReturnType<typeof useScroll>["scrollYProgress"] }) {
  const start = index / total;
  const end = start + (1 / total);
  const isHighlight = index === total - 2 || index === total - 1;

  const opacity = useTransform(scrollYProgress, [start, end], [0.1, 1]);
  const y = useTransform(scrollYProgress, [start, end], [40, 0]);
  const color = useTransform(
    scrollYProgress,
    [start, end, Math.min(end + 0.1, 1)],
    ["#333333", "#FFFFFF", isHighlight ? "#C5A021" : "#FFFFFF"]
  );

  return (
    <motion.span
      style={{ opacity, y, color }}
      className="inline-block"
    >
      {word}
    </motion.span>
  );
}

export function Manifesto() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  return (
    <section ref={containerRef} className="relative h-[300vh] w-full bg-[#0A0A0A] text-white">
      <div className="sticky top-0 flex h-[100vh] w-full items-center justify-center overflow-hidden">

        <div className="container mx-auto px-4 sm:px-10 max-w-5xl">
          <p className="flex flex-wrap justify-center gap-x-3 gap-y-2 text-center text-3xl font-[900] uppercase tracking-tighter sm:gap-x-5 sm:gap-y-4 sm:text-5xl md:text-7xl">
            {WORDS.map((word, i) => (
              <ManifestoWord
                key={i}
                word={word}
                index={i}
                total={WORDS.length}
                scrollYProgress={scrollYProgress}
              />
            ))}
          </p>
        </div>

      </div>
    </section>
  );
}
