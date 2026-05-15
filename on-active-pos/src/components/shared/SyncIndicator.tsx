import { CloudOff, Cloud, CloudSync, RefreshCw } from 'lucide-react';
import { useSync } from '../../hooks/useSync';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export function SyncIndicator() {
  const isOnline = useOnlineStatus();
  const { status, pendingCount, lastError, syncNow } = useSync();

  if (!isOnline) {
    return (
      <div className="flex items-center gap-2 text-[var(--pos-warning)]" title="Offline">
        <CloudOff className="w-4 h-4" />
        <span className="text-xs">{pendingCount} pending</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <button onClick={syncNow} className="flex items-center gap-2 text-[var(--pos-error)] hover:opacity-80" title={lastError || 'Sync failed'}>
        <RefreshCw className="w-4 h-4" />
        <span className="text-xs">Sync Error</span>
      </button>
    );
  }

  if (status === 'syncing') {
    return (
      <div className="flex items-center gap-2 text-[var(--pos-info)]">
        <CloudSync className="w-4 h-4 animate-pulse" />
        <span className="text-xs">Syncing...</span>
      </div>
    );
  }

  if (pendingCount > 0) {
    return (
      <div className="flex items-center gap-2 text-[var(--pos-warning)]">
        <Cloud className="w-4 h-4" />
        <span className="text-xs">{pendingCount} pending</span>
      </div>
    );
  }

  return (
    <button onClick={syncNow} className="flex items-center gap-2 text-[var(--pos-success)] hover:opacity-80 transition-opacity" title="Synced - Click to refresh">
      <Cloud className="w-4 h-4" />
      <span className="text-xs">Synced</span>
    </button>
  );
}
