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
 * Strategy: Try Supabase first (which admin can update via external API or manually).
 * Fallback to local IndexedDB cache.
 */
export async function fetchExchangeRates(): Promise<ExchangeRates> {
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
    console.warn('Failed to fetch exchange rates from Supabase:', e);
  }

  // Fallback to local cache
  return getLocalExchangeRates();
}

export async function getLocalExchangeRates(): Promise<ExchangeRates> {
  const rates: ExchangeRates = { ZIG: 26.5, ZAR: 18.2, lastUpdated: 'cached', isLive: false };

  const localRates = await db.exchangeRates.toArray();
  for (const r of localRates) {
    if (r.target_currency === 'ZIG') rates.ZIG = r.rate;
    if (r.target_currency === 'ZAR') rates.ZAR = r.rate;
    rates.lastUpdated = r.fetched_at || 'cached';
  }
  // If we got local data, it's better than hardcoded but still not live
  if (localRates.length > 0) rates.isLive = false;

  return rates;
}
