'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Store, MonitorSmartphone, Globe, Users } from 'lucide-react';
import { formatUSD } from '@/lib/admin/utils';

interface CombinedMetricsPanelProps {
  metrics: {
    webstore: { revenue: number; count: number };
    pos: { revenue: number; count: number; walkIn: number; salesman: number };
    online: { pending: number; inProgress: number; revenue: number; count: number };
    totalRevenue: number;
    totalOrdersToday: number;
    openShifts: number;
    salesmenOnFloor: number;
  };
}

// Premium micro-animation helper component for real-time value changes
function AnimatedNumber({ 
  value, 
  className, 
  accentColor = '#C5A021', 
  normalColor = '#ffffff' 
}: { 
  value: string | number; 
  className?: string; 
  accentColor?: string; 
  normalColor?: string 
}) {
  return (
    <motion.span
      key={value}
      initial={{ scale: 1.15, color: accentColor }}
      animate={{ scale: 1, color: normalColor }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={className}
      style={{ display: 'inline-block' }}
    >
      {value}
    </motion.span>
  );
}

export function CombinedMetricsPanel({ metrics }: CombinedMetricsPanelProps) {
  const [filter, setFilter] = useState('all');
  const [localMetrics, setLocalMetrics] = useState(metrics);

  // Sync state if server-side props change
  useEffect(() => {
    setLocalMetrics(metrics);
  }, [metrics]);

  // Poll API route every 4 seconds for high-performance real-time updates
  useEffect(() => {
    let active = true;

    const pollMetrics = async () => {
      try {
        const res = await fetch('/api/admin/metrics');
        if (!res.ok) return;
        const data = await res.json();
        if (active) {
          setLocalMetrics(data);
        }
      } catch (err) {
        console.error('Error fetching real-time metrics:', err);
      }
    };

    const interval = setInterval(pollMetrics, 4000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Revenue Section */}
      <div className="bg-[#111] border border-[#1f1f1f] rounded-[8px] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[#1f1f1f] bg-[#0a0a0a]">
          <h2 className="text-white font-bold text-sm uppercase tracking-wider">Revenue Today</h2>
          <select 
            className="bg-[#1a1a1a] text-[#aaa] text-xs border border-[#2a2a2a] rounded px-2 py-1 outline-none"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Sources</option>
            <option value="web">Webstore</option>
            <option value="pos">POS</option>
          </select>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-[#1f1f1f]">
          <div className="p-6">
            <p className="text-[#666] text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
              <Globe size={12} /> Total
            </p>
            <AnimatedNumber 
              value={formatUSD(localMetrics.totalRevenue)} 
              className="text-3xl font-black tracking-tight font-mono mb-1" 
            />
            <p className="text-[#444] text-[10px] uppercase tracking-wider">Combined</p>
          </div>
          <div className="p-6">
            <p className="text-[#666] text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
              <MonitorSmartphone size={12} /> Webstore
            </p>
            <AnimatedNumber 
              value={formatUSD(localMetrics.webstore.revenue)} 
              className="text-3xl font-black tracking-tight font-mono mb-1" 
            />
            <p className="text-[#444] text-[10px] uppercase tracking-wider">Orders</p>
          </div>
          <div className="p-6">
            <p className="text-[#666] text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
              <Store size={12} /> POS
            </p>
            <AnimatedNumber 
              value={formatUSD(localMetrics.pos.revenue)} 
              className="text-3xl font-black tracking-tight font-mono mb-1" 
            />
            <p className="text-[#444] text-[10px] uppercase tracking-wider">Completed</p>
          </div>
          <div className="p-6 bg-[#1a1a1a]/30">
            <p className="text-[#C5A021] text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
              <Store size={12} /> Online (Pending)
            </p>
            <AnimatedNumber 
              value={formatUSD(localMetrics.online.revenue)} 
              className="text-3xl font-black tracking-tight font-mono mb-1" 
              accentColor="#ffffff"
              normalColor="#C5A021"
            />
            <div className="text-[#C5A021]/60 text-[10px] uppercase tracking-wider flex items-center gap-1">
              <AnimatedNumber value={localMetrics.online.pending} accentColor="#ffffff" normalColor="#C5A021" /> wait
              <span>|</span>
              <AnimatedNumber value={localMetrics.online.inProgress} accentColor="#ffffff" normalColor="#C5A021" /> prep
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Orders Section */}
        <div className="bg-[#111] border border-[#1f1f1f] rounded-[8px] p-6">
          <h2 className="text-[#666] text-[10px] font-bold uppercase tracking-widest mb-4">Orders Today</h2>
          <div className="flex items-end justify-between mb-4">
            <AnimatedNumber 
              value={localMetrics.totalOrdersToday} 
              className="text-4xl font-black tracking-tight font-mono" 
            />
            <p className="text-[#444] text-xs pb-1">Combined</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex flex-col">
              <span className="text-[#888]">Walk-in</span>
              <AnimatedNumber value={localMetrics.pos.walkIn} className="font-bold" />
            </div>
            <div className="w-px h-6 bg-[#2a2a2a]"></div>
            <div className="flex flex-col">
              <span className="text-[#888]">Salesman</span>
              <AnimatedNumber value={localMetrics.pos.salesman} className="font-bold" />
            </div>
            <div className="w-px h-6 bg-[#2a2a2a]"></div>
            <div className="flex flex-col">
              <span className="text-[#888]">Online</span>
              <AnimatedNumber value={localMetrics.webstore.count} className="font-bold" />
            </div>
          </div>
        </div>

        {/* Staff Section */}
        <div className="bg-[#111] border border-[#1f1f1f] rounded-[8px] p-6 flex flex-col justify-between">
          <h2 className="text-[#666] text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
            <Users size={12} /> Active Shifts
          </h2>
          <div className="flex items-end justify-between mb-4">
            <AnimatedNumber 
              value={localMetrics.openShifts} 
              className="text-4xl font-black tracking-tight font-mono" 
              accentColor="#ffffff"
              normalColor="#00b4ff"
            />
            <p className="text-[#444] text-xs pb-1">Open Shifts</p>
          </div>
          <div className="flex items-center justify-between text-xs bg-[#0a0a0a] border border-[#1a1a1a] rounded px-3 py-2">
            <span className="text-[#888]">Salesmen on floor:</span>
            <AnimatedNumber value={localMetrics.salesmenOnFloor} className="font-bold" />
          </div>
        </div>
      </div>
    </div>
  );
}
