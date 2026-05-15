import { useEffect, useState } from 'react';
import { useSessionStore } from '../../stores/sessionStore';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useExchangeRates } from '../../hooks/useExchangeRates';
import { Badge } from '../shared/Badge';
import { SyncIndicator } from '../shared/SyncIndicator';

export function StatusBar() {
  const { employee, store } = useSessionStore();
  const isOnline = useOnlineStatus();
  const { rates } = useExchangeRates();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000); // update every minute
    return () => clearInterval(timer);
  }, []);

  if (!employee || !store) return null;

  return (
    <div className="h-12 bg-[var(--pos-surface)] border-b border-[var(--pos-border)] flex items-center justify-between px-4 text-sm select-none">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-[var(--pos-success)]' : 'bg-[var(--pos-error)]'}`} />
          <span className="text-[var(--pos-text-secondary)]">{isOnline ? 'Online' : 'Offline'}</span>
        </div>
        <div className="w-px h-4 bg-[var(--pos-border)]" />
        <SyncIndicator />
        <div className="w-px h-4 bg-[var(--pos-border)]" />
        <span className="font-medium text-white">{store.name}</span>
      </div>

      <div className="flex items-center gap-4 text-[var(--pos-text-secondary)]">
        <div className="font-mono text-xs hidden md:block">
          {!rates.isLive && <span title="Rates from cache, not live">⚠️ </span>}
          USD/ZIG: {rates.ZIG.toFixed(2)} | USD/ZAR: {rates.ZAR.toFixed(2)}
        </div>
        
        <div className="w-px h-4 bg-[var(--pos-border)]" />
        
        <div className="flex items-center gap-2">
          <span>{employee.full_name}</span>
          <Badge variant={employee.role === 'salesman' ? 'salesman' : 'info'}>
            {employee.role === 'salesman' ? 'Sales' : 'Till'}
          </Badge>
        </div>

        <div className="w-px h-4 bg-[var(--pos-border)]" />
        
        <span className="font-mono w-12 text-right">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}
