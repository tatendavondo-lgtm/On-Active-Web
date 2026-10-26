import { createClient } from '@supabase/supabase-js';

export async function getLiveZigRate(): Promise<number> {
  // 1. Try fetching from Supabase exchange_rates table first
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await supabase
      .from('exchange_rates')
      .select('rate')
      .eq('base_currency', 'USD')
      .eq('target_currency', 'ZIG')
      .maybeSingle();

    if (data && data.rate) {
      return Number(data.rate);
    }
  } catch (err) {
    console.error('Failed to fetch ZiG rate from database:', err);
  }

  // 2. Fallback to Open Exchange API
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD', {
      next: { revalidate: 3600 } // Cache for 1 hour in Next.js
    });
    const data = await response.json();
    if (data && data.rates) {
      const zig = data.rates.ZWG || data.rates.ZIG;
      if (zig) return Number(zig);
    }
  } catch (err) {
    console.error('Failed to fetch live ZiG rate from Open Exchange API:', err);
  }

  return 26.5; // Default fallback
}
