"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";

export function ScrambleText({ text, duration = 1.5, delay = 0, className = "" }: { text: string; duration?: number; delay?: number; className?: string }) {
  const [displayText, setDisplayText] = useState(text.replace(/./g, "\u00A0")); // fill with non-breaking spaces initially
  
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let frames: number;

    const startAnimation = () => {
      let iteration = 0;
      const totalFrames = duration * 60; // Assuming 60fps
      
      const interval = setInterval(() => {
        setDisplayText(
          text
            .split("")
            .map((char, index) => {
              if (char === " ") return " ";
              if (index < iteration) {
                return text[index];
              }
              return CHARS[Math.floor(Math.random() * CHARS.length)];
            })
            .join("")
        );
        
        if (iteration >= text.length) {
          clearInterval(interval);
        }
        
        // Increase iteration based on total frames to sync with duration
        iteration += text.length / totalFrames;
      }, 1000 / 60);
    };

    timeout = setTimeout(startAnimation, delay * 1000);

    return () => clearTimeout(timeout);
  }, [text, duration, delay]);

  return (
    <motion.span 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
      className={className}
    >
      {displayText}
    </motion.span>
  );
}
