import { createClient } from './supabase/client';
import type { StoreSettings } from '@/types';
import { getLiveZigRate } from './exchangeRates';

export async function getSettings(): Promise<StoreSettings> {
  const supabase = createClient();
  const { data, error } = await supabase.from('settings').select('key, value');
  const zigRate = await getLiveZigRate();

  if (error || !data) {
    return {
      zig_rate: zigRate,
      whatsapp_number: '+263782610691',
      delivery_fee_usd: 3,
      free_delivery_threshold_usd: 50,
    };
  }

  const map = Object.fromEntries(data.map((r) => [r.key, r.value]));
  
  return {
    zig_rate: zigRate,
    whatsapp_number: map.whatsapp_number ?? '+263782610691',
    delivery_fee_usd: parseFloat(map.delivery_fee_usd ?? '3'),
    free_delivery_threshold_usd: parseFloat(map.free_delivery_threshold_usd ?? '50'),
  };
}

