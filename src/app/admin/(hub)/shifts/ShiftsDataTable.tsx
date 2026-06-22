'use client';

import { useState } from 'react';
import { formatUSD } from '@/lib/currency';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, Search } from 'lucide-react';

interface ShiftData {
  id: string;
  operatorName: string;
  storeName: string;
  expectedCash: number;
  actualCash: number;
  variance: number;
  openedAt: string;
  closedAt: string;
  status: string;
}

export function ShiftsDataTable({ data }: { data: ShiftData[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof ShiftData>('closedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: keyof ShiftData) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredData = data.filter((shift) => 
    shift.operatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shift.storeName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedData = [...filteredData].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue === null || bValue === null) return 0;
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888]" />
          <input 
            type="text"
            placeholder="Search operator or store..."
            className="w-full bg-[#111] border border-[#222] rounded-md pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#C5A021]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-[#111] border border-[#1f1f1f] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-[#888] uppercase bg-[#181818] border-b border-[#222]">
              <tr>
                <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('operatorName')}>
                  <div className="flex items-center gap-1">Operator <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('closedAt')}>
                  <div className="flex items-center gap-1">Time Closed <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('expectedCash')}>
                  <div className="flex items-center gap-1">Expected <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('actualCash')}>
                  <div className="flex items-center gap-1">Actual <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('variance')}>
                  <div className="flex items-center gap-1">Variance <ArrowUpDown className="w-3 h-3" /></div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f1f1f]">
              {sortedData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-[#666]">No shifts found.</td>
                </tr>
              ) : (
                sortedData.map((shift) => {
                  const isShort = shift.variance < 0;
                  const isSurplus = shift.variance > 0;
                  
                  return (
                    <tr key={shift.id} className="hover:bg-[#151515] transition-colors">
                      <td className="px-6 py-4 font-medium text-[#ccc]">
                        {shift.operatorName}
                        <span className="block text-[10px] text-[#666]">{shift.storeName}</span>
                      </td>
                      <td className="px-6 py-4 text-[#888]">
                        {shift.status === 'open' ? (
                          <Badge variant="outline" className="text-blue-400 border-blue-900 bg-blue-950/30">Active Now</Badge>
                        ) : (
                          <>
                            {new Date(shift.closedAt).toLocaleDateString()}
                            <span className="block text-xs">{new Date(shift.closedAt).toLocaleTimeString()}</span>
                          </>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-[#aaa]">{formatUSD(shift.expectedCash)}</td>
                      <td className="px-6 py-4 font-mono text-[#aaa]">{formatUSD(shift.actualCash)}</td>
                      <td className="px-6 py-4">
                        {shift.status === 'open' ? (
                          <span className="text-[#555]">-</span>
                        ) : shift.variance === 0 ? (
                          <Badge variant="outline" className="text-emerald-400 border-emerald-900 bg-emerald-950/30">Balanced</Badge>
                        ) : (
                          <span className={`font-mono font-bold ${isShort ? 'text-red-400' : 'text-blue-400'}`}>
                            {isSurplus ? '+' : ''}{formatUSD(shift.variance)}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
