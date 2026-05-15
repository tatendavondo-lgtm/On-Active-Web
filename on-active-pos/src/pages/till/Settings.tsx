import { useState } from 'react';
import { useSessionStore } from '../../stores/sessionStore';
import { useExchangeRates } from '../../hooks/useExchangeRates';
import { useSync } from '../../hooks/useSync';
import { printerService } from '../../lib/printer';
import { Button } from '../../components/shared/Button';
import { Badge } from '../../components/shared/Badge';
import { 
  Printer, 
  Globe, 
  RefreshCw, 
  Database, 
  Smartphone, 
  Store as StoreIcon,
  Shield,
  CreditCard,
  Trash2
} from 'lucide-react';

export default function Settings() {
  const { store, deviceId } = useSessionStore();
  const { rates } = useExchangeRates();
  const { status: syncStatus, pendingCount, syncNow } = useSync();
  const [printerInfo, setPrinterInfo] = useState(printerService.getPrinterStatus());
  const [isRefreshingRates, setIsRefreshingRates] = useState(false);

  const handleTestPrint = async () => {
    try {
      await printerService.testPrint();
      alert('Test print sent!');
    } catch (e) {
      alert('Test print failed: ' + (e as Error).message);
    }
  };

  const handleReconnectPrinter = async () => {
    const ok = await printerService.connectPrinter();
    setPrinterInfo(printerService.getPrinterStatus());
    if (ok) alert('Printer connected!');
  };

  return (
    <div className="flex flex-col h-full bg-[var(--pos-bg)] overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto w-full p-8 space-y-8 pb-20">
        <div>
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-[var(--pos-text-secondary)]">Manage POS configuration and hardware</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-8">
            {/* Store Info */}
            <section className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--pos-text-muted)] flex items-center gap-2">
                <StoreIcon className="w-4 h-4" />
                Store
              </h3>
              <div className="bg-[var(--pos-surface)] p-5 rounded-[var(--pos-radius-lg)] border border-[var(--pos-border)] space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--pos-text-secondary)]">Store Name</span>
                  <span className="text-sm font-medium text-white">{store?.name}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[var(--pos-text-secondary)]">Store Code</span>
                  <Badge variant="info">{store?.id.split('-').pop()?.toUpperCase()}</Badge>
                </div>
                <div className="flex justify-between items-center text-sm pt-4 border-t border-[var(--pos-border-subtle)]">
                  <span className="text-[var(--pos-text-secondary)] flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    Geofence
                  </span>
                  <span className="text-emerald-400 font-medium">Active (20m)</span>
                </div>
              </div>
            </section>

            {/* Printer Settings */}
            <section className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--pos-text-muted)] flex items-center gap-2">
                <Printer className="w-4 h-4" />
                Printer
              </h3>
              <div className="bg-[var(--pos-surface)] p-5 rounded-[var(--pos-radius-lg)] border border-[var(--pos-border)] space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${printerInfo.connected ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <span className="text-sm text-white font-medium">
                      {printerInfo.connected ? `Connected (${printerInfo.type})` : 'Disconnected'}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleReconnectPrinter}>
                    Reconnect
                  </Button>
                </div>
                <div className="flex gap-3">
                  <Button variant="secondary" size="sm" className="flex-1" onClick={handleTestPrint} disabled={!printerInfo.connected}>
                    Test Print
                  </Button>
                  <select className="bg-[var(--pos-bg)] border border-[var(--pos-border)] text-xs rounded px-3 h-10 focus:outline-none flex-1">
                    <option>80mm (Standard)</option>
                    <option>58mm (Small)</option>
                  </select>
                </div>
              </div>
            </section>

            {/* App Info */}
            <section className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--pos-text-muted)] flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                App & Device
              </h3>
              <div className="bg-[var(--pos-surface)] p-5 rounded-[var(--pos-radius-lg)] border border-[var(--pos-border)] space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--pos-text-secondary)]">Version</span>
                  <span className="text-sm font-mono text-white">1.0.0-stable</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--pos-text-secondary)]">Device ID</span>
                  <span className="text-[10px] font-mono text-[var(--pos-text-muted)]">{deviceId}</span>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-8">
            {/* Exchange Rates */}
            <section className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--pos-text-muted)] flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Exchange Rates
              </h3>
              <div className="bg-[var(--pos-surface)] p-5 rounded-[var(--pos-radius-lg)] border border-[var(--pos-border)] space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[var(--pos-bg)] p-3 rounded text-center">
                    <span className="text-[10px] text-[var(--pos-text-muted)] uppercase block mb-1">USD/ZIG</span>
                    <span className="text-xl font-mono font-bold text-white">{rates.ZIG.toFixed(2)}</span>
                  </div>
                  <div className="bg-[var(--pos-bg)] p-3 rounded text-center">
                    <span className="text-[10px] text-[var(--pos-text-muted)] uppercase block mb-1">USD/ZAR</span>
                    <span className="text-xl font-mono font-bold text-white">{rates.ZAR.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-[10px] text-[var(--pos-text-muted)]">
                    Updated: {rates.lastUpdated !== 'loading' ? new Date(rates.lastUpdated).toLocaleTimeString() : 'Never'}
                  </span>
                  <Button variant="ghost" size="sm" className="h-8 text-[10px]" onClick={() => setIsRefreshingRates(true)}>
                    <RefreshCw className={`w-3 h-3 mr-2 ${isRefreshingRates ? 'animate-spin' : ''}`} />
                    Refresh Now
                  </Button>
                </div>
              </div>
            </section>

            {/* Sync Settings */}
            <section className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--pos-text-muted)] flex items-center gap-2">
                <Database className="w-4 h-4" />
                Synchronization
              </h3>
              <div className="bg-[var(--pos-surface)] p-5 rounded-[var(--pos-radius-lg)] border border-[var(--pos-border)] space-y-5">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--pos-text-secondary)]">Status</span>
                  <Badge variant={syncStatus === 'error' ? 'error' : syncStatus === 'syncing' ? 'info' : 'success'}>
                    {syncStatus.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[var(--pos-text-secondary)]">Pending Items</span>
                  <span className="font-mono text-white">{pendingCount}</span>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="secondary" size="sm" className="flex-1" onClick={() => syncNow()}>
                    Sync Now
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1 text-red-400 hover:text-red-300 hover:bg-red-500/5">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear Queue
                  </Button>
                </div>
              </div>
            </section>

            {/* Payment Config */}
            <section className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--pos-text-muted)] flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Payments
              </h3>
              <div className="bg-[var(--pos-surface)] p-5 rounded-[var(--pos-radius-lg)] border border-[var(--pos-border)] space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-[var(--pos-text-muted)] uppercase">EcoCash Merchant</label>
                  <input type="text" className="w-full bg-[var(--pos-bg)] border border-[var(--pos-border)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--pos-accent)]" placeholder="077XXXXXXX" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-[var(--pos-text-muted)] uppercase">InnBucks Account</label>
                  <input type="text" className="w-full bg-[var(--pos-bg)] border border-[var(--pos-border)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--pos-accent)]" placeholder="XXXXXX" />
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
