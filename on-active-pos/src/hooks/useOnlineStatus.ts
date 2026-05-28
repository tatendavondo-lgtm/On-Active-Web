import { useState, useEffect } from 'react';

export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    let handler: any = null;

    import('@capacitor/network').then(({ Network }) => {
      // Initial check
      Network.getStatus().then(status => {
        setOnline(status.connected);
      });

      // Listeners
      Network.addListener('networkStatusChange', status => {
        setOnline(status.connected);
      }).then(h => {
        handler = h;
      });
    }).catch(() => {
      // Fallback for non-capacitor environments
      const on = () => setOnline(true);
      const off = () => setOnline(false);
      window.addEventListener('online', on);
      window.addEventListener('offline', off);
      handler = { remove: () => {
        window.removeEventListener('online', on);
        window.removeEventListener('offline', off);
      }};
    });

    return () => {
      if (handler) {
        handler.remove();
      }
    };
  }, []);

  return online;
}
