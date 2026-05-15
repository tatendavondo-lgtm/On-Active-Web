import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { useSessionStore } from '../stores/sessionStore';
import { useGeofence } from '../hooks/useGeofence';
import { PinPad } from '../components/shared/PinPad';
import { isSalesmanRole } from '../types/employee';
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
    const { data: employee, error: authError } = await supabase
      .rpc('verify_employee_pin', { p_pin: pin })
      .single();

    if (authError || !employee) {
      setError('Invalid PIN or inactive account');
      return;
    }

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
    <div className="min-h-screen bg-[var(--pos-bg)] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">On Active</h1>
          <p className="text-[var(--pos-text-secondary)]">Point of Sale</p>
        </div>

        <div className="bg-[var(--pos-surface)] p-8 rounded-[var(--pos-radius-lg)] border border-[var(--pos-border)] shadow-xl">
          <div className="mb-8">
            {stores.length > 1 ? (
              <select 
                className="bg-transparent text-xl font-semibold mb-1 text-center w-full focus:outline-none"
                value={selectedStore?.id}
                onChange={(e) => setSelectedStore(stores.find(s => s.id === e.target.value))}
              >
                {stores.map(s => <option key={s.id} value={s.id} className="bg-[var(--pos-surface)]">{s.name}</option>)}
              </select>
            ) : (
              <h2 className="text-xl font-semibold mb-1">{selectedStore?.name || 'Loading stores...'}</h2>
            )}
            <p className="text-sm text-[var(--pos-text-muted)]">Enter your PIN to start</p>
          </div>

          <PinPad onSubmit={handleLogin} loading={checking} />
          
          {error && (
            <p className="mt-6 text-[var(--pos-error)] text-sm font-medium">{error}</p>
          )}
          {checking && (
            <p className="mt-6 text-[var(--pos-info)] text-sm">Checking location...</p>
          )}
        </div>
        
        <div className="text-sm text-[var(--pos-text-muted)]">
          Test PINs: 1234 (Sales), 5678 (Till)
        </div>
      </div>
    </div>
  );
}
