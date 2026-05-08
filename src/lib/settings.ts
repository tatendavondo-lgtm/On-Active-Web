import { createClient } from './supabase/client';
import type { StoreSettings } from '@/types';

export async function getSettings(): Promise<StoreSettings> {
  const supabase = createClient();
  const { data, error } = await supabase.from('settings').select('key, value');

  if (error || !data) {
    return {
      zig_rate: 13.5,
      whatsapp_number: '',
      delivery_fee_usd: 3,
      free_delivery_threshold_usd: 50,
    };
  }

  const map = Object.fromEntries(data.map((r) => [r.key, r.value]));
  
  return {
    zig_rate: parseFloat(map.zig_rate ?? '13.5'),
    whatsapp_number: map.whatsapp_number ?? '',
    delivery_fee_usd: parseFloat(map.delivery_fee_usd ?? '3'),
    free_delivery_threshold_usd: parseFloat(map.free_delivery_threshold_usd ?? '50'),
  };
}
