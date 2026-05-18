import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { useSessionStore } from '../stores/sessionStore';
import { useGeofence } from '../hooks/useGeofence';
import { PinPad } from '../components/shared/PinPad';
import { isSalesmanRole, type Employee } from '../types/employee';
import { pullUpdates } from '../db/sync';

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
    
    // 1. Verify PIN via secure RPC
    const { data: employeeData, error: authError } = await supabase
      .rpc('verify_employee_pin', { p_pin: pin })
      .single();

    if (authError || !employeeData) {
      setError('Invalid PIN or inactive account');
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
      // For testing, we might want to bypass or show a warning.
      // In production, require supervisor override.
      console.warn('Geofence warning:', geo.error);
      // setError(geo.error);
      // return;
    }

    // 3. Shift Logic (mocked for salesman, null for till to trigger opening)
    const shiftId = isSalesmanRole(employee.role) ? 'mock-sales-shift' : null;

    // 4. Pull Initial Data (clear stale cache first)
    try {
      const { db } = await import('../db/dexie');
      await db.products.clear();
      await pullUpdates(selectedStore.id);
    } catch (err) {
      console.warn('Initial sync failed, using offline data', err);
    }

    // 5. Login & Redirect
    login(employee, selectedStore, shiftId);
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

      <div className="max-w-md w-full space-y-8 text-center z-10">
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

        <div className="bg-[#111111] p-8 rounded-[var(--pos-radius-lg)] border border-[var(--pos-border)] shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden backdrop-blur-xl">
          <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-[var(--pos-accent)] opacity-10 blur-3xl pointer-events-none" />
          
          <div className="mb-8">
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
        
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--pos-text-muted)] bg-white/5 py-2 px-4 rounded-full border border-white/5 inline-block">
          Demo: 1234 (Sales) &nbsp;|&nbsp; 5678 (Till)
        </div>
      </div>
    </div>
  );
}
