import { createClient } from '@supabase/supabase-js';
import type { StoreSettings } from '@/types';
import { getLiveZigRate } from './exchangeRates';

export async function getSettings(): Promise<StoreSettings> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data, error } = await supabase.from('settings').select('key, value');
  const zigRate = await getLiveZigRate();

  if (error || !data) {
    return {
      zig_rate: zigRate,
      whatsapp_number: '+263782836513',
      delivery_fee_usd: 3,
      free_delivery_threshold_usd: 50,
      ecocash_details: 'Pay via EcoCash — our team will confirm merchant details on WhatsApp.',
      bank_details: 'Bank Transfer — our team will share account details on WhatsApp.',
    };
  }

  const map = Object.fromEntries(data.map((r) => [r.key, r.value]));
  
  return {
    zig_rate: zigRate,
    whatsapp_number: map.whatsapp_number ?? '+263782836513',
    delivery_fee_usd: parseFloat(map.delivery_fee_usd ?? '3'),
    free_delivery_threshold_usd: parseFloat(map.free_delivery_threshold_usd ?? '50'),
    ecocash_details: map.ecocash_details || 'Pay via EcoCash — our team will confirm merchant details on WhatsApp.',
    bank_details: map.bank_details || 'Bank Transfer — our team will share account details on WhatsApp.',
  };
}
