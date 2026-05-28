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

// Employee data is now fetched from Supabase via PIN verification

export default function Login() {
  const [error, setError] = useState('');
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const navigate = useNavigate();
  const { login } = useSessionStore();
  const { checkGeofence, checking } = useGeofence();

  useEffect(() => {
    async function loadStores() {
      const { data } = await supabase.from('stores').select('*').eq('is_active', true);
      if (data) {
        setStores(data);
        setSelectedStore(data[0]);
      }
    }
    loadStores();
  }, []);

  const handleLogin = async (pin: string) => {
    setError('');
    
    // 1. Verify PIN via secure RPC or Local Cache
    let employeeData = null;
    let authError = null;

    try {
      if (navigator.onLine) {
        const res = await supabase.rpc('verify_employee_pin', { p_pin: pin }).single();
        employeeData = res.data;
        authError = res.error;

        if (employeeData && !authError) {
          // Cache for offline login
          localStorage.setItem(`cached_employee_${pin}`, JSON.stringify(employeeData));
        }
      }
    } catch (e) {
      console.warn("Network error during login, falling back to local cache", e);
    }

    // Fallback to local storage if offline or network error
    if (!employeeData) {
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

    if (authError || !employeeData) {
      setError('Invalid PIN or inactive account (or device is offline and no cache exists)');
      return;
    }

    const employee = employeeData as Employee;

    // 2. Geofence Check
    if (!selectedStore) {
      setError('No store selected');
      return;
    }
    const geo = await checkGeofence(selectedStore);
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
      await pullUpdates(selectedStore.id);

      // Check if this cashier already has an active open shift in this store
      if (!isSalesmanRole(employee.role)) {
        const existingShifts = await db.shifts
          .where('employee_id')
          .equals(employee.id)
          .toArray();
        const activeShift = existingShifts.find(
          s => s.store_id === selectedStore.id && s.status === 'open'
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
          s => s.store_id === selectedStore.id && s.status === 'open'
        );
        if (activeShift) {
          shiftId = activeShift.id;
        }
      } catch (dbErr) {
        console.error('Dexie direct shift recovery failed:', dbErr);
      }
    }

    // 4. Login & Redirect
    login(employee, selectedStore, shiftId);

    logPosAction({
      userId: employee.id,
      userName: employee.full_name,
      userRole: employee.role,
      action: 'login',
      targetType: 'terminal',
      targetId: selectedStore.id,
      storeId: selectedStore.id
    });

    // Initialize audio context on first user interaction (login)
    playNotificationSound.init().catch(console.warn);

    if (isSalesmanRole(employee.role)) {
      navigate('/sales');
    } else {
      navigate('/till');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--pos-bg)] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[var(--pos-accent)] opacity-[0.03] blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] rounded-full bg-white opacity-[0.01] blur-3xl pointer-events-none" />

      <div className="max-w-md w-full space-y-4 sm:space-y-8 text-center z-10">
        <div className="flex flex-col items-center">
          <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-[var(--pos-accent)] shadow-[0_0_30px_rgba(197,160,33,0.15)] mb-4 bg-black flex items-center justify-center">
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

        <div className="bg-[#111111] p-6 sm:p-8 rounded-[var(--pos-radius-lg)] border border-[var(--pos-border)] shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden backdrop-blur-xl">
          <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-[var(--pos-accent)] opacity-10 blur-3xl pointer-events-none" />
          
          <div className="mb-4 sm:mb-8">
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
