import { useState, useEffect } from 'react';
import { useSessionStore } from '../../stores/sessionStore';
import { Capacitor } from '@capacitor/core';
import { useExchangeRates } from '../../hooks/useExchangeRates';
import { useSync } from '../../hooks/useSync';
import { printerService } from '../../lib/printer';
import { Button } from '../../components/shared/Button';
import { Badge } from '../../components/shared/Badge';
import { 
  Printer, 
  Database, 
  RefreshCw, 
  Smartphone, 
  Store as StoreIcon,
  Shield,
  CreditCard,
  Trash2,
  Cpu,
  Sparkles,
  Wifi,
  WifiOff
} from 'lucide-react';

type TabType = 'store' | 'printer' | 'database' | 'payments';

export default function Settings() {
  const { store, deviceId } = useSessionStore();
  const { rates } = useExchangeRates();
  const { status: syncStatus, pendingCount, syncNow } = useSync();
  const [printerInfo, setPrinterInfo] = useState(printerService.getPrinterStatus());
  const [isRefreshingRates, setIsRefreshingRates] = useState(false);
  const [isNative] = useState(Capacitor.isNativePlatform());
  const [isScanning, setIsScanning] = useState(false);
  const [nativeDevices, setNativeDevices] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('store');

  useEffect(() => {
    // Keep printer info in sync if it changes
    setPrinterInfo(printerService.getPrinterStatus());
    const interval = setInterval(() => {
      setPrinterInfo(printerService.getPrinterStatus());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleTestPrint = async () => {
    try {
      await printerService.testPrint();
      alert('Test print sent successfully!');
    } catch (e) {
      alert('Test print failed: ' + (e as Error).message);
    }
  };

  const handleReconnectPrinter = async () => {
    const ok = await printerService.connectPrinter();
    setPrinterInfo(printerService.getPrinterStatus());
    if (ok) alert('Printer connected successfully!');
  };

  const handleScanNative = async () => {
    setIsScanning(true);
    try {
      const devices = await printerService.scanNativePrinters();
      setNativeDevices(devices);
      if (devices.length === 0) alert('No Bluetooth devices found nearby.');
    } catch (e: any) {
      alert('Failed to scan: ' + e.message);
    } finally {
      setIsScanning(false);
    }
  };

  const handleConnectNative = async (address: string) => {
    const ok = await printerService.connectNativePrinter(address);
    setPrinterInfo(printerService.getPrinterStatus());
    if (ok) alert('Connected to printer!');
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0c] text-zinc-100 overflow-y-auto custom-scrollbar relative">
      {/* Premium Background Lighting Accents */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-0 w-[400px] h-[400px] bg-zinc-800/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto w-full p-6 md:p-12 space-y-8 pb-32 z-10 relative">
        
        {/* Spacious & Clean Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-800/80 pb-8">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Settings Manager</span>
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tight text-white">POS Configuration</h1>
            <p className="text-zinc-400 text-sm">Configure hardware, offline databases, local merchants, and currency parameters</p>
          </div>
          <div className="flex items-center gap-2 bg-zinc-900/40 border border-zinc-800/60 px-4 py-2.5 rounded-2xl backdrop-blur-md self-start md:self-auto">
            <Cpu className="w-4 h-4 text-zinc-500" />
            <span className="text-xs text-zinc-400 font-medium">Terminal ID:</span>
            <span className="text-xs font-mono font-black text-emerald-400">{deviceId.substring(0, 8).toUpperCase()}</span>
          </div>
        </div>

        {/* Spacious Side-by-Side Sidebar Navigation Layout */}
        <div className="flex flex-col md:flex-row gap-10 items-start">
          
          {/* Navigation Panel */}
          <nav className="flex flex-row md:flex-col gap-2 w-full md:w-64 bg-zinc-900/20 border border-zinc-800/40 p-2 rounded-2xl overflow-x-auto md:overflow-x-visible backdrop-blur-md">
            <button 
              onClick={() => setActiveTab('store')}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-wider rounded-xl transition-all duration-300 w-full whitespace-nowrap ${
                activeTab === 'store' 
                  ? 'bg-zinc-800 text-white shadow-md border border-zinc-700/50' 
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
              }`}
            >
              <StoreIcon className="w-4 h-4" />
              <span>Store Profile</span>
            </button>
            <button 
              onClick={() => setActiveTab('printer')}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-wider rounded-xl transition-all duration-300 w-full whitespace-nowrap ${
                activeTab === 'printer' 
                  ? 'bg-zinc-800 text-white shadow-md border border-zinc-700/50' 
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>Printer Setup</span>
            </button>
            <button 
              onClick={() => setActiveTab('database')}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-wider rounded-xl transition-all duration-300 w-full whitespace-nowrap ${
                activeTab === 'database' 
                  ? 'bg-zinc-800 text-white shadow-md border border-zinc-700/50' 
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Data & Sync</span>
            </button>
            <button 
              onClick={() => setActiveTab('payments')}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-wider rounded-xl transition-all duration-300 w-full whitespace-nowrap ${
                activeTab === 'payments' 
                  ? 'bg-zinc-800 text-white shadow-md border border-zinc-700/50' 
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Merchants</span>
            </button>
          </nav>

          {/* Active Content Container - Giving plenty of breathing room */}
          <div className="flex-1 w-full bg-zinc-950/40 border border-zinc-800/60 p-8 md:p-10 rounded-3xl shadow-xl min-h-[400px] backdrop-blur-md">
            
            {/* STORE TAB */}
            {activeTab === 'store' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="border-b border-zinc-800/60 pb-4">
                  <h2 className="text-xl font-black uppercase tracking-tight text-white">Store Profile Details</h2>
                  <p className="text-zinc-400 text-xs mt-1">Global settings and geofence verification details for this register</p>
                </div>
                
                <div className="space-y-6">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-zinc-400">Registered Name</span>
                    <span className="text-sm font-black text-white uppercase tracking-wider">{store?.name}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-t border-zinc-900/80">
                    <span className="text-sm text-zinc-400">Store Code</span>
                    <Badge variant="info" className="px-3 py-1 font-black rounded-lg bg-zinc-900 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest text-xs">
                      {store?.id.split('-').pop()?.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center py-4 border-t border-zinc-900/80">
                    <span className="text-sm text-zinc-400 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      Geofence Guard Protection
                    </span>
                    <span className="flex items-center gap-2 text-emerald-400 font-bold text-xs bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-full animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      Active (Range 50m)
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-t border-zinc-900/80">
                    <span className="text-sm text-zinc-400 flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-emerald-400" />
                      WebView Platform ID
                    </span>
                    <span className="text-xs font-mono font-medium text-zinc-400 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800/80 max-w-[200px] truncate">{deviceId}</span>
                  </div>
                </div>
              </div>
            )}

            {/* PRINTER SETUP TAB */}
            {activeTab === 'printer' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="border-b border-zinc-800/60 pb-4">
                  <h2 className="text-xl font-black uppercase tracking-tight text-white">Receipt Printer Setup</h2>
                  <p className="text-zinc-400 text-xs mt-1">Manage Bluetooth thermal hardware connections and paper size formatting</p>
                </div>
                
                <div className="space-y-6">
                  {/* Status Indicator */}
                  <div className="flex justify-between items-center bg-zinc-900/30 border border-zinc-800/40 p-5 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className="relative flex h-3.5 w-3.5">
                        {printerInfo.connected && (
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        )}
                        <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${printerInfo.connected ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Bluetooth Status</span>
                        <span className="text-base font-black text-white uppercase tracking-wider mt-0.5">
                          {printerInfo.connected ? (
                            <span className="text-emerald-400 flex items-center gap-2">
                              <Wifi className="w-4 h-4 animate-bounce" /> {printerInfo.deviceName || 'Thermal Printer Connected'}
                            </span>
                          ) : (
                            <span className="text-red-400 flex items-center gap-2">
                              <WifiOff className="w-4 h-4" /> Disconnected
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="rounded-xl border border-zinc-800 text-xs font-bold uppercase tracking-wider px-4 py-2 hover:bg-zinc-800" onClick={handleReconnectPrinter}>
                      {isNative ? 'Auto-Pair' : 'Reconnect'}
                    </Button>
                  </div>

                  {/* Bluetooth Scanner */}
                  <div className="space-y-4">
                    <Button 
                      variant="primary" 
                      size="sm" 
                      className={`w-full h-12 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 ${
                        isScanning 
                          ? 'bg-zinc-900 border-zinc-800 text-zinc-500' 
                          : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-950/20'
                      }`} 
                      onClick={handleScanNative} 
                      disabled={isScanning}
                    >
                      {isScanning ? (
                        <span className="flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin" /> Scanning Radio Frequencies...
                        </span>
                      ) : (
                        isNative ? 'Scan Bluetooth Peripherals' : 'Scan Web Bluetooth Channels'
                      )}
                    </Button>

                    {nativeDevices.length > 0 && (
                      <div className="space-y-2 mt-4 animate-in slide-in-from-top-2 duration-300">
                        <p className="text-xs font-black uppercase tracking-wider text-zinc-500 px-1">Discovered Devices:</p>
                        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                          {nativeDevices.map(d => (
                            <div key={d.address} className="flex justify-between items-center bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/40 hover:border-zinc-700 transition-all duration-200">
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-white">{d.name || 'Generic Print Station'}</span>
                                <span className="text-[10px] font-mono text-zinc-500 tracking-wider uppercase mt-0.5">{d.address}</span>
                              </div>
                              <Button variant="ghost" size="sm" className="h-8 text-xs font-bold rounded-lg border border-zinc-800 bg-zinc-950/20 hover:bg-emerald-600 hover:text-white hover:border-transparent transition-all duration-200" onClick={() => handleConnectNative(d.address)}>Connect</Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sizing & Actions */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-zinc-900/80">
                    <div className="flex-1 flex flex-col gap-2">
                      <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 px-1">Roll Sizing</label>
                      <select className="bg-zinc-900/40 border border-zinc-800/80 text-xs font-bold uppercase tracking-wider text-white rounded-xl px-4 h-12 focus:outline-none focus:border-zinc-700 w-full">
                        <option>80mm Paper Width (Standard)</option>
                        <option>58mm Paper Width (Compact)</option>
                      </select>
                    </div>
                    <div className="flex-1 flex flex-col gap-2 justify-end">
                      <Button variant="secondary" size="sm" className="h-12 text-xs font-black uppercase tracking-wider rounded-xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800 w-full" onClick={handleTestPrint} disabled={!printerInfo.connected}>
                        Send Test Receipt Print
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DATA & SYNC TAB */}
            {activeTab === 'database' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="border-b border-[#1b1b22] pb-4">
                  <h2 className="text-xl font-black uppercase tracking-tight text-white">Database & Synchronization</h2>
                  <p className="text-zinc-400 text-xs mt-1">Manage local offline cache database queues and exchange rates</p>
                </div>
                
                <div className="space-y-6">
                  {/* Exchange Rates Header */}
                  <div className="space-y-3">
                    <p className="text-xs font-black uppercase tracking-wider text-zinc-500 px-1">Live Exchange Rates</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-zinc-900/30 border border-zinc-800/40 p-5 rounded-2xl flex justify-between items-center">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">USD to ZiG</span>
                        <span className="text-xl font-black text-white">{rates.ZIG.toFixed(2)}</span>
                      </div>
                      <div className="bg-zinc-900/30 border border-zinc-800/40 p-5 rounded-2xl flex justify-between items-center">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">USD to ZAR</span>
                        <span className="text-xl font-black text-white">{rates.ZAR.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                        Last Refreshed: {rates.lastUpdated !== 'loading' ? new Date(rates.lastUpdated).toLocaleTimeString() : 'Unknown'}
                      </span>
                      <Button variant="ghost" size="sm" className="h-9 text-xs font-bold rounded-xl border border-zinc-800 bg-zinc-950/20 hover:bg-zinc-900" onClick={() => setIsRefreshingRates(true)}>
                        <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isRefreshingRates ? 'animate-spin' : ''}`} />
                        Sync Rates
                      </Button>
                    </div>
                  </div>

                  {/* Sync Queue */}
                  <div className="space-y-4 pt-4 border-t border-zinc-900/80">
                    <p className="text-xs font-black uppercase tracking-wider text-zinc-500 px-1">Synchronization Engine</p>
                    
                    <div className="flex justify-between items-center bg-zinc-900/30 border border-zinc-800/40 p-4 rounded-xl">
                      <span className="text-sm text-zinc-400 font-medium">Supabase Channel Connection</span>
                      <Badge className="font-black uppercase tracking-widest px-3.5 py-1 text-[9px] rounded-lg border" variant={syncStatus === 'error' ? 'error' : syncStatus === 'syncing' ? 'info' : 'success'}>
                        {syncStatus}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center bg-zinc-900/10 p-4 rounded-xl">
                      <span className="text-sm text-zinc-400 font-medium">Pending Sync Operations</span>
                      <span className="font-black text-xl text-white">{pendingCount}</span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-2">
                      <Button variant="secondary" size="sm" className="flex-1 h-12 text-xs font-black uppercase tracking-wider rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-850" onClick={() => syncNow()}>
                        Flush Synchronization Queue
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex-1 h-12 text-xs font-black uppercase tracking-wider rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/5 border border-red-500/10 bg-red-950/5"
                        onClick={async () => {
                          if (confirm("Are you sure you want to clear all local orders and start afresh?")) {
                            const { db } = await import('../../db/dexie');
                            await db.salesmanOrders.clear();
                            alert("Local orders queue cleared successfully!");
                            window.location.reload();
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear Local Cache DB
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MERCHANTS TAB */}
            {activeTab === 'payments' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="border-b border-zinc-800/60 pb-4">
                  <h2 className="text-xl font-black uppercase tracking-tight text-white">Merchant Config</h2>
                  <p className="text-zinc-400 text-xs mt-1">Configure parameters for direct cash-to-mobile client integrations</p>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 px-1">EcoCash Merchant Account</label>
                    <input type="text" className="w-full h-12 bg-zinc-900/40 border border-zinc-800/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all duration-200" placeholder="e.g. 077XXXXXXX" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 px-1">InnBucks Merchant Terminal ID</label>
                    <input type="text" className="w-full h-12 bg-zinc-900/40 border border-zinc-800/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all duration-200" placeholder="e.g. XXXXXX" />
                  </div>
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}
