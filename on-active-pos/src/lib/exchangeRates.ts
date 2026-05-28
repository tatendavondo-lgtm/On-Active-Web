import { supabase } from '../config/supabase';
import { db } from '../db/dexie';

export interface ExchangeRates {
  ZIG: number;
  ZAR: number;
  lastUpdated: string;
  isLive: boolean;
}

/**
 * Fetch live exchange rates.
 * Strategy: 
 * 1. Query the free, real-time public Open Exchange API for absolute live ZAR and ZiG (ZWG) rates.
 * 2. Fallback to Supabase central database exchange rates.
 * 3. Fallback to local offline IndexedDB cache.
 */
export async function fetchExchangeRates(): Promise<ExchangeRates> {
  // 1. Try public Open Exchange Rates API first
  try {
    console.log('Querying Open Exchange Rates API for live currency updates...');
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await response.json();
    
    if (data && data.rates) {
      // ZWG is the ISO code for Zimbabwe Gold (ZiG)
      const zig = data.rates.ZWG || data.rates.ZIG || 26.5;
      const zar = data.rates.ZAR || 18.2;
      const timeISO = new Date().toISOString();

      const rates: ExchangeRates = {
        ZIG: zig,
        ZAR: zar,
        lastUpdated: timeISO,
        isLive: true
      };

      // Update local IndexedDB Cache
      await db.exchangeRates.clear();
      await db.exchangeRates.put({
        id: 'ZIG',
        target_currency: 'ZIG',
        rate: zig,
        fetched_at: timeISO
      });
      await db.exchangeRates.put({
        id: 'ZAR',
        target_currency: 'ZAR',
        rate: zar,
        fetched_at: timeISO
      });

      console.log('Successfully loaded and cached live rates:', rates);
      return rates;
    }
  } catch (e) {
    console.warn('Open Exchange Rates API unavailable, attempting Supabase fallback...', e);
  }

  // 2. Fallback to Supabase Central Database
  try {
    const { data } = await supabase
      .from('exchange_rates')
      .select('*')
      .eq('base_currency', 'USD');

    if (data && data.length > 0) {
      const rates: ExchangeRates = { ZIG: 26.5, ZAR: 18.2, lastUpdated: new Date().toISOString(), isLive: true };

      for (const r of data) {
        if (r.target_currency === 'ZIG') rates.ZIG = r.rate;
        if (r.target_currency === 'ZAR') rates.ZAR = r.rate;
      }
      rates.lastUpdated = new Date().toISOString();

      // Cache locally
      await db.exchangeRates.clear();
      for (const r of data) {
        await db.exchangeRates.put({
          id: r.id,
          target_currency: r.target_currency,
          rate: r.rate,
          fetched_at: r.fetched_at || new Date().toISOString(),
        });
      }

      return rates;
    }
  } catch (e) {
    console.warn('Supabase offline, attempting offline cache database fallback...', e);
  }

  // 3. Fallback to local offline IndexedDB cache
  return getLocalExchangeRates();
}

export async function getLocalExchangeRates(): Promise<ExchangeRates> {
  const rates: ExchangeRates = { ZIG: 26.5, ZAR: 18.2, lastUpdated: 'cached', isLive: false };

  try {
    const localRates = await db.exchangeRates.toArray();
    for (const r of localRates) {
      if (r.target_currency === 'ZIG') rates.ZIG = r.rate;
      if (r.target_currency === 'ZAR') rates.ZAR = r.rate;
      rates.lastUpdated = r.fetched_at || 'cached';
    }
    // If we got local data, flag it as cached
    if (localRates.length > 0) rates.isLive = false;
  } catch (e) {
    console.error('Failed reading IndexedDB exchange cache:', e);
  }

  return rates;
}
