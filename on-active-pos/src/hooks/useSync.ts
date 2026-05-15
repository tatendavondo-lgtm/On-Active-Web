import { useState, useEffect, useCallback, useRef } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import { useSessionStore } from '../stores/sessionStore';
import { processSyncQueue, pullUpdates } from '../db/sync';
import { db } from '../db/dexie';
import { supabase } from '../config/supabase';

export interface SyncState {
  status: 'idle' | 'syncing' | 'error';
  pendingCount: number;
  lastSyncAt: string | null;
  lastError: string | null;
  syncNow: () => Promise<void>;
}

export function useSync(): SyncState {
  const isOnline = useOnlineStatus();
  const store = useSessionStore(s => s.store);
  const [status, setStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const [pendingCount, setPendingCount] = useState(0);
  const isSyncingRef = useRef(false);

  const checkPendingCount = useCallback(async () => {
    const newCount = await db.syncQueue.count();
    setPendingCount(prev => prev !== newCount ? newCount : prev);
  }, []);

  const syncNow = useCallback(async () => {
    if (!isOnline || !store) return;
    if (isSyncingRef.current) return;

    isSyncingRef.current = true;
    setStatus('syncing');
    setLastError(null);

    try {
      await processSyncQueue();
      await pullUpdates(store.id);
      await checkPendingCount();
      setLastSyncAt(new Date().toISOString());
      setStatus('idle');
    } catch (err: any) {
      console.error('Sync error:', err);
      setLastError(err.message || 'Unknown sync error');
      setStatus('error');
    } finally {
      isSyncingRef.current = false;
    }
  }, [isOnline, store, checkPendingCount]);

  // Periodic sync (ONLY pushes local changes up, doesn't pull down entire catalog)
  useEffect(() => {
    if (!isOnline || !store) return;

    checkPendingCount();

    const interval = setInterval(() => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;
      setStatus('syncing');
      processSyncQueue()
        .then(() => checkPendingCount())
        .catch(console.error)
        .finally(() => {
          setStatus('idle');
          isSyncingRef.current = false;
        });
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [isOnline, store, checkPendingCount]);

  // Realtime listeners for catalog updates
  useEffect(() => {
    if (!isOnline || !store) return;
    
    const handleCatalogChange = () => {
      console.log('Catalog changed remotely! Pulling updates...');
      pullUpdates(store.id).catch(console.error);
    };

    const channelName = `catalog-changes-${store.id}-${Date.now()}`;
    const sub = supabase.channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, handleCatalogChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_variants' }, handleCatalogChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'store_inventory', filter: `store_id=eq.${store.id}` }, handleCatalogChange)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to ${channelName}`);
        }
      });

    return () => {
      console.log(`Cleaning up ${channelName}`);
      supabase.removeChannel(sub);
    };
  }, [isOnline, store]);

  // Sync when coming back online
  const prevOnlineRef = useRef(isOnline);
  useEffect(() => {
    if (isOnline && !prevOnlineRef.current) {
      syncNow();
    }
    prevOnlineRef.current = isOnline;
  }, [isOnline, syncNow]);

  return {
    status,
    pendingCount,
    lastSyncAt,
    lastError,
    syncNow
  };
}
