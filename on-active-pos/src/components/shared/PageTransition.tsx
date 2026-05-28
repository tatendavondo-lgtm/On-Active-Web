import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

export function PageTransition({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`h-full w-full ${className}`}
    >
      {children}
    </motion.div>
  );
}
