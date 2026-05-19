'use client';

import { useState } from 'react';
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

export function CombinedMetricsPanel({ metrics }: CombinedMetricsPanelProps) {
  const [filter, setFilter] = useState('all');

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
            <p className="text-white text-3xl font-black tracking-tight font-mono mb-1">{formatUSD(metrics.totalRevenue)}</p>
            <p className="text-[#444] text-[10px] uppercase tracking-wider">Combined</p>
          </div>
          <div className="p-6">
            <p className="text-[#666] text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
              <MonitorSmartphone size={12} /> Webstore
            </p>
            <p className="text-white text-3xl font-black tracking-tight font-mono mb-1">{formatUSD(metrics.webstore.revenue)}</p>
            <p className="text-[#444] text-[10px] uppercase tracking-wider">Orders</p>
          </div>
          <div className="p-6">
            <p className="text-[#666] text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
              <Store size={12} /> POS
            </p>
            <p className="text-white text-3xl font-black tracking-tight font-mono mb-1">{formatUSD(metrics.pos.revenue)}</p>
            <p className="text-[#444] text-[10px] uppercase tracking-wider">Completed</p>
          </div>
          <div className="p-6 bg-[#1a1a1a]/30">
            <p className="text-[#C5A021] text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
              <Store size={12} /> Online (Pending)
            </p>
            <p className="text-[#C5A021] text-3xl font-black tracking-tight font-mono mb-1">{formatUSD(metrics.online.revenue)}</p>
            <p className="text-[#C5A021]/60 text-[10px] uppercase tracking-wider">{metrics.online.pending} wait | {metrics.online.inProgress} prep</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Orders Section */}
        <div className="bg-[#111] border border-[#1f1f1f] rounded-[8px] p-6">
          <h2 className="text-[#666] text-[10px] font-bold uppercase tracking-widest mb-4">Orders Today</h2>
          <div className="flex items-end justify-between mb-4">
            <p className="text-white text-4xl font-black tracking-tight font-mono">{metrics.totalOrdersToday}</p>
            <p className="text-[#444] text-xs pb-1">Combined</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex flex-col">
              <span className="text-[#888]">Walk-in</span>
              <span className="text-white font-bold">{metrics.pos.walkIn}</span>
            </div>
            <div className="w-px h-6 bg-[#2a2a2a]"></div>
            <div className="flex flex-col">
              <span className="text-[#888]">Salesman</span>
              <span className="text-white font-bold">{metrics.pos.salesman}</span>
            </div>
            <div className="w-px h-6 bg-[#2a2a2a]"></div>
            <div className="flex flex-col">
              <span className="text-[#888]">Online</span>
              <span className="text-white font-bold">{metrics.webstore.count}</span>
            </div>
          </div>
        </div>

        {/* Staff Section */}
        <div className="bg-[#111] border border-[#1f1f1f] rounded-[8px] p-6 flex flex-col justify-between">
          <h2 className="text-[#666] text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
            <Users size={12} /> Active Shifts
          </h2>
          <div className="flex items-end justify-between mb-4">
            <p className="text-[#00b4ff] text-4xl font-black tracking-tight font-mono">{metrics.openShifts}</p>
            <p className="text-[#444] text-xs pb-1">Open Shifts</p>
          </div>
          <div className="flex items-center justify-between text-xs bg-[#0a0a0a] border border-[#1a1a1a] rounded px-3 py-2">
            <span className="text-[#888]">Salesmen on floor:</span>
            <span className="text-white font-bold">{metrics.salesmenOnFloor}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
