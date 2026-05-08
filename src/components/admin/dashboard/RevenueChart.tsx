'use client';

import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { RevenueDataPoint } from '@/types';
import { formatUSD } from '@/lib/admin/utils';

type Range = '7' | '30' | '90';

interface RevenueChartProps {
  data: RevenueDataPoint[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#111] border border-[#1f1f1f] rounded-[6px] px-3 py-2.5 shadow-xl">
      <p className="text-[#666] text-xs mb-1">{label}</p>
      <p className="text-white font-bold text-sm">{formatUSD(payload[0].value)}</p>
    </div>
  );
}

export function RevenueChart({ data }: RevenueChartProps) {
  const [range, setRange] = useState<Range>('30');

  const filtered = data.slice(-parseInt(range));

  return (
    <div className="bg-[#111] border border-[#1f1f1f] rounded-[8px] p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-white font-bold text-sm">Revenue</h2>
          <p className="text-[#444] text-xs mt-0.5">Daily USD earnings</p>
        </div>
        <div className="flex items-center gap-1 bg-[#0a0a0a] border border-[#1f1f1f] rounded-[6px] p-1">
          {(['7', '30', '90'] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-[4px] transition-all duration-150 ${
                range === r
                  ? 'bg-[#C5A021] text-black'
                  : 'text-[#444] hover:text-white'
              }`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={filtered} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#1a1a1a" strokeDasharray="none" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: '#444', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: '#444', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${v}`}
            width={48}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#2a2a2a', strokeWidth: 1 }} />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#C5A021"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#C5A021', strokeWidth: 0 }}
            isAnimationActive={true}
            animationDuration={800}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
