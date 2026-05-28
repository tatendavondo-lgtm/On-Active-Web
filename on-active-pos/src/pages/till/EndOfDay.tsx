import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/dexie';
import { useSessionStore } from '../../stores/sessionStore';
import { formatUSD, formatZIG, formatZAR } from '../../lib/currency';
import { Button } from '../../components/shared/Button';
import { Numpad } from '../../components/shared/Numpad';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Info } from 'lucide-react';

export default function EndOfDay() {
  const { employee, shiftId, logout } = useSessionStore();
  const navigate = useNavigate();
  const [actualCash, setActualCash] = useState('');
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState<'summary' | 'count'>('summary');

  // Fetch orders for this shift
  const shiftOrders = useLiveQuery(
    () => db.orders.where('shift_id').equals(shiftId || '').toArray(),
    [shiftId]
  );

  const currentShift = useLiveQuery(
    () => shiftId ? db.shifts.get(shiftId) : undefined,
    [shiftId]
  );

  const stats = useMemo(() => {
    if (!shiftOrders) return null;
    
    const summary = {
      totalSales: 0,
      orderCount: 0,
      sources: { walk_in: 0, salesman: 0, online: 0 },
      discounts: { auto: 0, manual: 0, total: 0 },
      payments: {
        cash_usd: 0,
        cash_zig: 0, // local amount
        cash_zig_usd: 0, // usd equivalent
        cash_zar: 0,
        cash_zar_usd: 0,
        ecocash: 0,
        innbucks: 0,
        card: 0,
        online: 0
      }
    };

    shiftOrders.forEach(o => {
      summary.totalSales += o.total;
      summary.orderCount += 1;
      (summary.sources as any)[o.source] += 1;
      summary.discounts.auto += o.auto_discount_amount || 0;
      summary.discounts.manual += o.manual_discount_amount || 0;
      summary.discounts.total += (o.auto_discount_amount || 0) + (o.manual_discount_amount || 0);

      o.payments.forEach(p => {
        if (p.method === 'cash') {
          if (!p.local_currency) summary.payments.cash_usd += p.amount_usd;
          else if (p.local_currency === 'ZIG') {
            summary.payments.cash_zig += p.amount_local || 0;
            summary.payments.cash_zig_usd += p.amount_usd;
          }
          else if (p.local_currency === 'ZAR') {
            summary.payments.cash_zar += p.amount_local || 0;
            summary.payments.cash_zar_usd += p.amount_usd;
          }
        } else if (p.method === 'ecocash') summary.payments.ecocash += p.amount_usd;
        else if (p.method === 'innbucks') summary.payments.innbucks += p.amount_usd;
        else if (p.method === 'card') summary.payments.card += p.amount_usd;
        else if (p.method === 'online_payment') summary.payments.online += p.amount_usd;
      });
    });

    return summary;
  }, [shiftOrders]);

  const openingFloat = currentShift?.opening_cash || 0;
  const expectedCash = (stats?.payments.cash_usd || 0) + openingFloat;
  const actualCashNum = parseFloat(actualCash) || 0;
  const difference = actualCashNum - expectedCash;

  const handleCloseShift = async () => {
    if (!shiftId) return;
    
    const now = new Date().toISOString();
    
    const closingData = {
      status: 'closed' as const,
      closed_at: now,
      closing_cash: actualCashNum,
      expected_cash: expectedCash,
      cash_difference: difference,
      notes: notes
    };

    // 1. Update local shift record
    await db.shifts.update(shiftId, closingData);
    
    // 2. Add to sync queue (Fix: table name changed to 'shifts' to match remote Supabase schema)
    await db.syncQueue.add({
      table: 'shifts',
      operation: 'update',
      data: {
        id: shiftId,
        ...closingData
      },
      created_at: now,
      attempts: 0
    });

    // 3. Logout
    logout();
    navigate('/login');
  };

  if (!stats) return <div className="p-8 animate-pulse text-[var(--pos-text-muted)]">Loading shift summary...</div>;

  return (
    <div className="flex flex-col h-full bg-[var(--pos-bg)] overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto w-full p-8 space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold mb-2">End of Day</h1>
            <p className="text-[var(--pos-text-secondary)]">Review and close your shift</p>
          </div>
          <div className="text-right text-sm">
            <p className="text-white font-medium">{employee?.full_name}</p>
            <p className="text-[var(--pos-text-muted)]">Shift opened: {currentShift ? new Date(currentShift.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unknown'}</p>
          </div>
        </div>

        {step === 'summary' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Sales Summary */}
            <div className="space-y-6">
              <section className="bg-[var(--pos-surface)] p-6 rounded-[var(--pos-radius-lg)] border border-[var(--pos-border)]">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--pos-text-muted)] mb-6 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Sales Summary
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[var(--pos-text-secondary)]">Total Sales</span>
                    <span className="text-2xl font-bold font-mono text-[var(--pos-success)]">{formatUSD(stats.totalSales)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--pos-text-muted)]">Total Orders</span>
                    <span className="font-mono">{stats.orderCount}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--pos-border-subtle)]">
                    <div className="text-center">
                      <span className="text-[10px] text-[var(--pos-text-muted)] uppercase">Walk-in</span>
                      <p className="font-mono text-sm">{stats.sources.walk_in}</p>
                    </div>
                    <div className="text-center border-x border-[var(--pos-border-subtle)]">
                      <span className="text-[10px] text-[var(--pos-text-muted)] uppercase">Salesman</span>
                      <p className="font-mono text-sm">{stats.sources.salesman}</p>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] text-[var(--pos-text-muted)] uppercase">Online</span>
                      <p className="font-mono text-sm">{stats.sources.online}</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="bg-[var(--pos-surface)] p-6 rounded-[var(--pos-radius-lg)] border border-[var(--pos-border)]">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--pos-text-muted)] mb-6">Discounts Given</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--pos-text-secondary)]">Auto (2%)</span>
                    <span className="font-mono text-amber-400">-{formatUSD(stats.discounts.auto)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--pos-text-secondary)]">Manual</span>
                    <span className="font-mono text-amber-400">-{formatUSD(stats.discounts.manual)}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-3 border-t border-[var(--pos-border-subtle)]">
                    <span>Total Discounts</span>
                    <span className="font-mono">-{formatUSD(stats.discounts.total)}</span>
                  </div>
                </div>
              </section>
            </div>

            {/* Payment Breakdown */}
            <div className="space-y-6">
              <section className="bg-[var(--pos-surface)] p-6 rounded-[var(--pos-radius-lg)] border border-[var(--pos-border)]">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--pos-text-muted)] mb-6">Payment Breakdown</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--pos-text-secondary)]">Cash (USD)</span>
                      <span className="font-mono">{formatUSD(stats.payments.cash_usd)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-[var(--pos-text-muted)]">
                      <span>Cash (ZIG)</span>
                      <span>{formatZIG(stats.payments.cash_zig)} (≈ {formatUSD(stats.payments.cash_zig_usd)})</span>
                    </div>
                    <div className="flex justify-between text-xs text-[var(--pos-text-muted)]">
                      <span>Cash (ZAR)</span>
                      <span>{formatZAR(stats.payments.cash_zar)} (≈ {formatUSD(stats.payments.cash_zar_usd)})</span>
                    </div>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-[var(--pos-border-subtle)]">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--pos-text-secondary)]">EcoCash</span>
                      <span className="font-mono">{formatUSD(stats.payments.ecocash)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--pos-text-secondary)]">Card</span>
                      <span className="font-mono">{formatUSD(stats.payments.card)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--pos-text-secondary)]">Online</span>
                      <span className="font-mono">{formatUSD(stats.payments.online)}</span>
                    </div>
                  </div>
                </div>
              </section>

              <Button 
                variant="primary" 
                className="w-full h-16 text-lg" 
                onClick={() => setStep('count')}
              >
                Proceed to Cash Count
              </Button>
            </div>
          </div>
        ) : (
          <div className="max-w-md mx-auto space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
            <section className="bg-[var(--pos-surface)] p-8 rounded-[var(--pos-radius-lg)] border border-[var(--pos-border)]">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--pos-text-muted)] mb-8 flex items-center justify-between">
                Cash Reconciliation (USD)
                <button onClick={() => setStep('summary')} className="text-[var(--pos-accent)] hover:underline flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" /> Back
                </button>
              </h3>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[var(--pos-bg)] p-4 rounded border border-[var(--pos-border)]">
                    <span className="text-[10px] text-[var(--pos-text-muted)] uppercase block mb-1">Expected</span>
                    <span className="text-xl font-mono font-bold text-white">{formatUSD(expectedCash)}</span>
                  </div>
                  <div className={`p-4 rounded border ${difference === 0 ? 'bg-emerald-500/10 border-emerald-500/20' : difference > 0 ? 'bg-blue-500/10 border-blue-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                    <span className="text-[10px] text-[var(--pos-text-muted)] uppercase block mb-1">Difference</span>
                    <span className={`text-xl font-mono font-bold ${difference === 0 ? 'text-emerald-400' : difference > 0 ? 'text-blue-400' : 'text-red-400'}`}>
                      {difference >= 0 ? '+' : ''}{formatUSD(difference)}
                    </span>
                  </div>
                </div>

                <div className="text-center">
                  <label className="text-sm text-[var(--pos-text-secondary)] mb-2 block">Actual Counted Cash</label>
                  <div className="text-4xl font-mono font-bold bg-[var(--pos-bg)] p-6 rounded-lg border-2 border-[var(--pos-accent)] text-[var(--pos-accent)]">
                    ${actualCash || '0.00'}
                  </div>
                </div>

                <div className="flex justify-center py-4">
                  <Numpad onValueChange={setActualCash} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-[var(--pos-text-secondary)]">Notes (optional)</label>
                  <textarea 
                    className="w-full bg-[var(--pos-bg)] border border-[var(--pos-border)] rounded p-3 text-sm focus:border-[var(--pos-accent)] focus:outline-none min-h-[80px]"
                    placeholder="Explain any discrepancies..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                  />
                </div>

                <Button 
                  variant="primary" 
                  className="w-full h-16 bg-[var(--pos-error)] hover:bg-red-500 text-white mt-4" 
                  onClick={handleCloseShift}
                >
                  <Lock className="w-5 h-5 mr-2" />
                  Close Shift & Logout
                </Button>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
