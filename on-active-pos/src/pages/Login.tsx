import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { useSessionStore } from '../stores/sessionStore';
import { useGeofence } from '../hooks/useGeofence';
import { PinPad } from '../components/shared/PinPad';
import { isSalesmanRole, type Employee } from '../types/employee';
import { pullUpdates } from '../db/sync';
import { logPosAction } from '../lib/audit';
import { playNotificationSound } from '../lib/notification';
import { Lock } from 'lucide-react';

// Employee data is now fetched from Supabase via PIN verification

export default function Login() {
  const [error, setError] = useState('');
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [terminalEmail, setTerminalEmail] = useState('');
  const [terminalPassword, setTerminalPassword] = useState('');
  const [setupLoading, setSetupLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useSessionStore();
  const { checkGeofence, checking } = useGeofence();

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    async function loadStores() {
      try {
        const { data, error } = await supabase.from('stores').select('*').eq('is_active', true);
        if (error) throw error;
        
        if (data && data.length > 0) {
          setStores(data);
          setSelectedStore(data[0]);
          localStorage.setItem('cached_stores', JSON.stringify(data));
        } else {
          // Try to load from cache if online fetch returned empty (maybe RLS issue, or just no stores)
          const cached = localStorage.getItem('cached_stores');
          if (cached) {
            const parsed = JSON.parse(cached);
            setStores(parsed);
            setSelectedStore(parsed[0]);
          } else {
            setError('No active stores found in database. Please create one.');
          }
        }
      } catch (err) {
        console.warn("Failed to load stores from cloud, checking cache...", err);
        const cached = localStorage.getItem('cached_stores');
        if (cached) {
          const parsed = JSON.parse(cached);
          setStores(parsed);
          setSelectedStore(parsed[0]);
        } else {
          setError('Offline: Could not load stores and no cache exists.');
        }
      }
    }
    loadStores();

    return () => subscription.unsubscribe();
  }, []);

  const handleTerminalSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSetupLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: terminalEmail,
      password: terminalPassword,
    });
    if (authError) {
      setError(authError.message);
    }
    setSetupLoading(false);
  };

  const handleLogin = async (pin: string) => {
    setError('');
    
    // 1. Verify PIN via secure RPC or Local Cache
    let employeeData = null;
    let authError = null;
    let serverReachedAndRejected = false;

    try {
      if (navigator.onLine) {
        const res = await supabase.rpc('verify_employee_pin', { p_pin: pin }).single();
        employeeData = res.data;
        authError = res.error;

        if (employeeData && !authError) {
          // Cache for offline login
          localStorage.setItem(`cached_employee_${pin}`, JSON.stringify(employeeData));
        } else if (authError && authError.code === 'PGRST116') {
          // Explicitly rejected by server (PIN invalid or employee deactivated)
          localStorage.removeItem(`cached_employee_${pin}`);
          serverReachedAndRejected = true;
        }
      }
    } catch (e) {
      console.warn("Network error during login, falling back to local cache", e);
    }

    // Fallback to local storage ONLY if offline or network error (NOT if server rejected)
    if (!employeeData && !serverReachedAndRejected) {
      const cached = localStorage.getItem(`cached_employee_${pin}`);
      if (cached) {
        try {
          employeeData = JSON.parse(cached);
          authError = null;
        } catch (e) {
          console.error("Failed to parse cached employee", e);
        }
      }
    }

    if (!employeeData) {
      setError('Invalid PIN or inactive account (or device is offline and no cache exists)');
      return;
    }

    const employee = employeeData as Employee;

    // 2. Resolve Store
    let targetStore = selectedStore;
    
    if (!targetStore && employee.store_id) {
      // Try to find it in loaded stores
      targetStore = stores.find(s => s.id === employee.store_id);
      
      // If still missing, fetch directly from DB
      if (!targetStore && navigator.onLine) {
        const { data: fetchStore } = await supabase.from('stores').select('*').eq('id', employee.store_id).single();
        if (fetchStore) {
          targetStore = fetchStore;
          setSelectedStore(fetchStore);
        }
      }
    }

    if (!targetStore) {
      setError('No store selected and could not determine store from employee profile.');
      return;
    }

    // 3. Geofence Check
    const geo = await checkGeofence(targetStore);
    if (!geo.allowed && geo.error) {
      console.warn('Geofence verification failed:', geo.error);
      setError(geo.error);
      return;
    }

    // 3. Pull Initial Data (clear stale cache first) & Check Shift Session Recovery
    let shiftId = isSalesmanRole(employee.role) ? 'mock-sales-shift' : null;
    try {
      const { db } = await import('../db/dexie');
      
      // Clear stale cache and pull updates
      await db.products.clear();
      await pullUpdates(targetStore.id);

      // Check if this cashier already has an active open shift in this store
      if (!isSalesmanRole(employee.role)) {
        const existingShifts = await db.shifts
          .where('employee_id')
          .equals(employee.id)
          .toArray();
        const activeShift = existingShifts.find(
          s => s.store_id === targetStore.id && s.status === 'open'
        );
        if (activeShift) {
          shiftId = activeShift.id;
          console.log('Recovered active POS shift:', shiftId);
        }
      }
    } catch (err) {
      console.warn('Initial sync or shift recovery failed, using offline data', err);
      // Fallback: still try to recover shift locally in case sync failed but DB exists
      try {
        const { db } = await import('../db/dexie');
        const existingShifts = await db.shifts
          .where('employee_id')
          .equals(employee.id)
          .toArray();
        const activeShift = existingShifts.find(
          s => s.store_id === targetStore.id && s.status === 'open'
        );
        if (activeShift) {
          shiftId = activeShift.id;
        }
      } catch (dbErr) {
        console.error('Dexie direct shift recovery failed:', dbErr);
      }
    }

    // 4. Login & Redirect
    login(employee, targetStore, shiftId);

    logPosAction({
      userId: employee.id,
      userName: employee.full_name,
      userRole: employee.role,
      action: 'login',
      targetType: 'terminal',
      targetId: targetStore.id,
      storeId: targetStore.id
    });

    // Initialize audio context on first user interaction (login)
    playNotificationSound.init().catch(console.warn);

    if (isSalesmanRole(employee.role)) {
      navigate('/sales');
    } else {
      navigate('/till');
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-[var(--pos-bg)] flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[var(--pos-accent)] opacity-[0.03] blur-3xl pointer-events-none" />
        <div className="max-w-md w-full space-y-8 text-center z-10">
          <div className="flex flex-col items-center">
            <div className="h-16 w-16 bg-[#111] rounded-full border border-white/10 flex items-center justify-center mb-4">
              <Lock className="text-[var(--pos-accent)]" size={24} />
            </div>
            <h1 className="text-2xl font-[900] uppercase tracking-tighter text-white">Terminal Setup</h1>
            <p className="text-[var(--pos-text-secondary)] text-[10px] font-black uppercase tracking-[0.2em] mt-2">Secure this POS Terminal to Supabase</p>
          </div>
          <form onSubmit={handleTerminalSetup} className="bg-[#111111] p-8 rounded-[var(--pos-radius-lg)] border border-[var(--pos-border)] shadow-[0_0_50px_rgba(0,0,0,0.5)] space-y-4">
            <div>
              <input 
                type="email" 
                placeholder="Admin Email" 
                value={terminalEmail}
                onChange={(e) => setTerminalEmail(e.target.value)}
                className="w-full bg-black border border-white/5 rounded-lg p-4 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[var(--pos-accent)] transition-colors"
                required
              />
            </div>
            <div>
              <input 
                type="password" 
                placeholder="Password" 
                value={terminalPassword}
                onChange={(e) => setTerminalPassword(e.target.value)}
                className="w-full bg-black border border-white/5 rounded-lg p-4 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[var(--pos-accent)] transition-colors"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={setupLoading}
              className="w-full bg-[var(--pos-accent)] text-black font-black uppercase tracking-widest py-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {setupLoading ? 'Authenticating...' : 'Connect Terminal'}
            </button>
            {error && <p className="mt-4 text-[var(--pos-error)] text-xs font-black uppercase tracking-widest">{error}</p>}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full bg-[var(--pos-bg)] flex flex-col items-center justify-center p-2 sm:p-4 relative overflow-hidden overflow-y-auto custom-scrollbar">
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[var(--pos-accent)] opacity-[0.03] blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] rounded-full bg-white opacity-[0.01] blur-3xl pointer-events-none" />

      <div className="max-w-md w-full space-y-3 sm:space-y-6 text-center z-10 py-4">
        <div className="flex flex-col items-center">
          <div className="relative h-16 w-16 sm:h-24 sm:w-24 overflow-hidden rounded-full border-2 border-[var(--pos-accent)] shadow-[0_0_30px_rgba(197,160,33,0.15)] mb-2 sm:mb-4 bg-black flex items-center justify-center">
            <img 
              src="/logo.jpg" 
              alt="On Active Wear" 
              className="h-full w-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
          <h1 className="text-3xl font-[900] uppercase tracking-tighter sm:text-4xl text-white">
            ON <span className="text-[var(--pos-accent)]">ACTIVE</span>.
          </h1>
          <p className="text-[var(--pos-text-secondary)] text-[10px] font-black uppercase tracking-[0.4em] mt-1.5 opacity-80">
            Point of Sale
          </p>
        </div>

        <div className="bg-[#111111] p-4 sm:p-8 rounded-[var(--pos-radius-lg)] border border-[var(--pos-border)] shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
          <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-[var(--pos-accent)] opacity-10 blur-3xl pointer-events-none" />
          
          <div className="mb-3 sm:mb-6">
            {stores.length > 1 ? (
              <select 
                className="bg-transparent text-xl font-black uppercase tracking-wider mb-2 text-center w-full focus:outline-none cursor-pointer text-white border-b border-[var(--pos-border)] pb-2 transition-colors hover:border-[var(--pos-accent)]"
                value={selectedStore?.id}
                onChange={(e) => setSelectedStore(stores.find(s => s.id === e.target.value))}
              >
                {stores.map(s => <option key={s.id} value={s.id} className="bg-[#111] text-white uppercase tracking-wider">{s.name}</option>)}
              </select>
            ) : (
              <h2 className="text-xl font-black uppercase tracking-wider text-white mb-2 border-b border-[var(--pos-border)] pb-2">{selectedStore?.name || 'Loading stores...'}</h2>
            )}
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--pos-text-muted)]">Enter PIN to Unlock Terminal</p>
          </div>

          <PinPad onSubmit={handleLogin} loading={checking} />
          
          {error && (
            <p className="mt-6 text-[var(--pos-error)] text-xs font-black uppercase tracking-widest animate-pulse">{error}</p>
          )}
          {checking && (
            <p className="mt-6 text-[var(--pos-info)] text-xs font-black uppercase tracking-widest">Verifying Terminal Location...</p>
          )}
        </div>
        
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--pos-text-muted)] bg-white/5 py-1.5 px-4 rounded-full border border-white/5 inline-block">
          Demo: 1234 (Sales) &nbsp;|&nbsp; 5678 (Till)
        </div>
      </div>
    </div>
  );
}
