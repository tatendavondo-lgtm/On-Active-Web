import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="bg-[var(--pos-warning)]/10 text-[var(--pos-warning)] px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium border-b border-[var(--pos-warning)]/20">
      <WifiOff className="w-4 h-4" />
      You're offline — transactions will sync when connection returns.
    </div>
  );
}
