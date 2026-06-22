import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, DollarSign, User } from 'lucide-react';
import { formatUSD } from '@/lib/currency';

interface Shift {
  id: string;
  expected_cash: number;
  closing_cash: number;
  cash_difference: number;
  closed_at: string;
  employees?: {
    full_name: string;
  };
}

interface ClosedShiftsTableProps {
  shifts: Shift[];
}

export function ClosedShiftsTable({ shifts }: ClosedShiftsTableProps) {
  return (
    <div className="bg-[#111] border border-[#1f1f1f] rounded-[8px] p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[#888]">Recent Shift Reports</h3>
          <p className="text-xs text-[#666] mt-1">Today's closed cash registers</p>
        </div>
        <Link 
          href="/admin/shifts" 
          className="text-xs text-[#C5A021] hover:text-[#d4b036] flex items-center gap-1 transition-colors"
        >
          View All <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        {shifts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-[#555] py-8">
            <DollarSign className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">No shifts closed today</p>
          </div>
        ) : (
          <div className="space-y-3">
            {shifts.map((shift) => {
              const opName = shift.employees?.full_name || 'Unknown Operator';
              const diff = shift.cash_difference || 0;
              const isShort = diff < 0;
              const isSurplus = diff > 0;
              
              return (
                <div 
                  key={shift.id} 
                  className="p-4 rounded-[6px] border border-[#1f1f1f] bg-[#151515] hover:border-[#2a2a2a] transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#1f1f1f] flex items-center justify-center">
                        <User className="w-3 h-3 text-[#888]" />
                      </div>
                      <span className="text-sm font-medium text-[#ccc]">{opName}</span>
                    </div>
                    <span className="text-xs text-[#666]">
                      {new Date(shift.closed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] uppercase text-[#666] mb-1">Expected / Actual</p>
                      <p className="text-sm font-mono text-[#aaa]">
                        {formatUSD(shift.expected_cash || 0)} <span className="text-[#555]">/</span> {formatUSD(shift.closing_cash || 0)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase text-[#666] mb-1">Variance</p>
                      {diff === 0 ? (
                        <Badge variant="outline" className="text-emerald-400 border-emerald-900 bg-emerald-950/30">
                          Balanced
                        </Badge>
                      ) : (
                        <span className={`text-sm font-mono font-bold ${isShort ? 'text-red-400' : 'text-blue-400'}`}>
                          {isSurplus ? '+' : ''}{formatUSD(diff)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
