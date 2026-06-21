'use client';

import { useState, useEffect } from 'react';
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

interface RevenueChartProps {
  initialData: RevenueDataPoint[];
  initialYear: number;
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

export function RevenueChart({ initialData, initialYear }: RevenueChartProps) {
  const [year, setYear] = useState<number>(initialYear);
  const [data, setData] = useState<RevenueDataPoint[]>(initialData);
  const [loading, setLoading] = useState(false);

  // Generate available years: e.g. from 2024 up to current year
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2024 + 1 }, (_, i) => 2024 + i);

  useEffect(() => {
    if (year === initialYear && initialData.length > 0) {
      setData(initialData);
      return;
    }

    let isMounted = true;
    setLoading(true);
    
    fetch(`/api/admin/metrics/revenue?year=${year}`)
      .then(res => res.json())
      .then(resData => {
        if (isMounted && resData.data) {
          setData(resData.data);
        }
      })
      .catch(err => console.error(err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [year, initialYear, initialData]);

  return (
    <div className="bg-[#111] border border-[#1f1f1f] rounded-[8px] p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-white font-bold text-sm">Revenue</h2>
          <p className="text-[#444] text-xs mt-0.5">Monthly USD earnings</p>
        </div>
        <div className="flex items-center gap-2">
          {loading && <span className="text-[#666] text-xs">Loading...</span>}
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="bg-[#0a0a0a] border border-[#1f1f1f] text-white text-xs font-semibold rounded-[6px] px-3 py-1.5 outline-none focus:border-[#C5A021]/50 cursor-pointer transition-colors"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#1a1a1a" strokeDasharray="none" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: '#444', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 'auto']}
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
