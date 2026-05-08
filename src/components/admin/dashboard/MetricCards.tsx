'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ShoppingCart, Package, AlertTriangle } from 'lucide-react';
import type { DashboardMetrics } from '@/types';
import { formatUSD } from '@/lib/admin/utils';
import { MetricCardSkeleton } from '../ui/SkeletonLoader';

function useCountUp(target: number, duration = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    let start: number | null = null;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return value;
}

interface CardProps {
  title: string;
  rawValue: number;
  displayValue: string;
  change: number;
  icon: React.ElementType;
  color: string;
  index: number;
}

function MetricCard({ title, rawValue, displayValue, change, icon: Icon, color, index }: CardProps) {
  const animated = useCountUp(rawValue);
  const isRevenue = displayValue.startsWith('$');
  const shown = isRevenue
    ? formatUSD(animated)
    : animated.toLocaleString();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
      className="bg-[#111] border border-[#1f1f1f] rounded-[8px] p-6 hover:border-[#2a2a2a] transition-colors duration-150"
    >
      <div className="flex items-start justify-between mb-5">
        <div
          className="w-9 h-9 rounded-[6px] flex items-center justify-center"
          style={{ backgroundColor: `${color}18` }}
        >
          <Icon size={17} style={{ color }} />
        </div>
        <span
          className={`text-xs font-bold ${change > 0 ? 'text-[#C5A021]' : change < 0 ? 'text-red-400' : 'text-[#444]'}`}
        >
          {change > 0 ? '+' : ''}{change !== 0 ? `${change}%` : 'â€”'}
        </span>
      </div>
      <p className="text-white text-3xl font-black tracking-tight mb-1.5 font-mono">
        {shown}
      </p>
      <p className="text-[#444] text-xs font-semibold uppercase tracking-widest">{title}</p>
    </motion.div>
  );
}

interface MetricCardsProps {
  metrics: DashboardMetrics | null;
  loading?: boolean;
}

export function MetricCards({ metrics, loading }: MetricCardsProps) {
  if (loading || !metrics) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => <MetricCardSkeleton key={i} />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <MetricCard index={0} title="Revenue This Month" rawValue={Math.round(metrics.totalRevenue)} displayValue={formatUSD(metrics.totalRevenue)} change={metrics.revenueChange} icon={TrendingUp} color="#C5A021" />
      <MetricCard index={1} title="Orders Today" rawValue={metrics.ordersToday} displayValue={String(metrics.ordersToday)} change={metrics.ordersTodayChange} icon={ShoppingCart} color="#00b4ff" />
      <MetricCard index={2} title="Active Products" rawValue={metrics.activeProducts} displayValue={String(metrics.activeProducts)} change={0} icon={Package} color="#a855f7" />
      <MetricCard index={3} title="Low Stock Items" rawValue={metrics.lowStockItems} displayValue={String(metrics.lowStockItems)} change={0} icon={AlertTriangle} color={metrics.lowStockItems > 0 ? '#f59e0b' : '#C5A021'} />
    </div>
  );
}
