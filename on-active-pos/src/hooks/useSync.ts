import { useState, useEffect, useCallback, useRef } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import { useSessionStore } from '../stores/sessionStore';
import { processSyncQueue, pullUpdates } from '../db/sync';
import { db } from '../db/dexie';
import { supabase } from '../config/supabase';

// Global locks to prevent multiple hook instances from creating duplicate intervals/listeners
let isIntervalRunning = false;
let isRealtimeSubscribed = false;
let globalSyncingLock = false;

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

  const checkPendingCount = useCallback(async () => {
    const newCount = await db.syncQueue.count();
    setPendingCount(prev => prev !== newCount ? newCount : prev);
  }, []);

  const syncNow = useCallback(async () => {
    if (!isOnline || !store) return;
    if (globalSyncingLock) return;

    globalSyncingLock = true;
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
      globalSyncingLock = false;
    }
  }, [isOnline, store, checkPendingCount]);

  // Periodic sync (ONLY pushes local changes up, doesn't pull down entire catalog)
  useEffect(() => {
    if (!isOnline || !store || isIntervalRunning) return;

    checkPendingCount();

    isIntervalRunning = true;
    const interval = setInterval(() => {
      if (globalSyncingLock) return;
      
      // Only auto-sync if we have internet and a store is loaded
      if (isOnline && store) {
        syncNow().catch(console.error);
      } else {
        // Just check count if offline
        checkPendingCount().catch(console.error);
      }
    }, 30000); // Increased frequency to 30 seconds for better responsiveness

    return () => {
      clearInterval(interval);
      isIntervalRunning = false;
    };
  }, [isOnline, store, checkPendingCount]);

  // Realtime listeners for catalog updates
  useEffect(() => {
    if (!isOnline || !store || isRealtimeSubscribed) return;
    
    isRealtimeSubscribed = true;
    const handleCatalogChange = () => {
      console.log('Catalog changed remotely! Pulling updates...');
      pullUpdates(store.id).catch(console.error);
    };

    const channelName = `catalog-changes-${store.id}-${Date.now()}`;
    const sub = supabase.channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, handleCatalogChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_variants' }, handleCatalogChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'store_inventory', filter: `store_id=eq.${store.id}` }, handleCatalogChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'salesman_orders', filter: `store_id=eq.${store.id}` }, handleCatalogChange)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'online_order_bridge', filter: `store_id=eq.${store.id}` }, handleCatalogChange)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'online_order_bridge', filter: `store_id=eq.${store.id}` }, handleCatalogChange)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to ${channelName}`);
        }
      });

    return () => {
      console.log(`Cleaning up ${channelName}`);
      supabase.removeChannel(sub);
      isRealtimeSubscribed = false;
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
