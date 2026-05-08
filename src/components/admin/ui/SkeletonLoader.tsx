'use client';

import { motion } from 'framer-motion';

export function Skeleton({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <motion.div
      animate={{ opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      className={`bg-[#1a1a1a] rounded-[4px] ${className}`}
      style={style}
    />
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="bg-[#111] border border-[#1f1f1f] rounded-[8px] p-6">
      <div className="flex items-start justify-between mb-4">
        <Skeleton className="w-9 h-9" />
        <Skeleton className="w-12 h-4" />
      </div>
      <Skeleton className="w-28 h-8 mb-2" />
      <Skeleton className="w-36 h-3" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 6 }: { cols?: number }) {
  return (
    <tr className="border-b border-[#181818]">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <Skeleton className="h-3.5" style={{ width: `${60 + Math.random() * 40}%` }} />
        </td>
      ))}
    </tr>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-[#111] border border-[#1f1f1f] rounded-[8px] p-6">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="w-32 h-5" />
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="w-12 h-7" />)}
        </div>
      </div>
      <Skeleton className="w-full h-64" />
    </div>
  );
}

export function InsightSkeleton() {
  return (
    <div className="bg-[#C5A021]/5 border border-[#C5A021]/15 rounded-[8px] p-5">
      <div className="flex items-center gap-2 mb-3">
        <Skeleton className="w-4 h-4" />
        <Skeleton className="w-24 h-3" />
      </div>
      <Skeleton className="w-full h-4 mb-2" />
      <Skeleton className="w-3/4 h-4" />
    </div>
  );
}
