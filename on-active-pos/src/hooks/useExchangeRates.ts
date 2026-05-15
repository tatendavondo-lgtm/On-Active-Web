import { useState, useEffect } from 'react';
import { fetchExchangeRates, type ExchangeRates } from '../lib/exchangeRates';
import { useOnlineStatus } from './useOnlineStatus';
import { EXCHANGE_RATE_REFRESH_INTERVAL } from '../config/constants';

export function useExchangeRates() {
  const [rates, setRates] = useState<ExchangeRates>({ ZIG: 26.5, ZAR: 18.2, lastUpdated: 'loading', isLive: false });
  const [loading, setLoading] = useState(true);
  const isOnline = useOnlineStatus();

  useEffect(() => {
    loadRates();
    // Refresh every 30 minutes when online
    const interval = setInterval(() => {
      if (isOnline) loadRates();
    }, EXCHANGE_RATE_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [isOnline]);

  async function loadRates() {
    try {
      const r = await fetchExchangeRates();
      setRates(r);
    } finally {
      setLoading(false);
    }
  }

  return { rates, loading, refresh: loadRates };
}
