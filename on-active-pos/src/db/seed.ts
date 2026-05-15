import { supabase } from '../config/supabase';
import { db } from './dexie';

/**
 * Pull full product catalog + store inventory + exchange rates into IndexedDB.
 * Call on first login and periodically when online.
 */
export async function seedProductCatalog(storeId: string): Promise<void> {
  const { data: products, error: prodErr } = await supabase
    .from('products')
    .select('*, product_variants(*)');

  if (prodErr) throw new Error(`Failed to fetch products: ${prodErr.message}`);

  const { data: inventory, error: invErr } = await supabase
    .from('store_inventory')
    .select('*')
    .eq('store_id', storeId);

  if (invErr) throw new Error(`Failed to fetch inventory: ${invErr.message}`);

  const stockMap = new Map<string, number>();
  inventory?.forEach((item) => {
    const key = `${item.product_id}-${item.variant_id || 'base'}`;
    stockMap.set(key, item.quantity);
  });

  const localProducts = products?.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category || 'uncategorized',
    sku: p.sku || '',
    image_url: p.image_url || p.images?.[0] || '',
    variants: (p.product_variants || []).map((v: any) => ({
      id: v.id,
      name: v.name || 'Standard',
      sku: v.sku || p.sku || '',
      price: Number(v.price) || Number(p.price_usd) || 0,
      stock: stockMap.get(`${p.id}-${v.id}`) ?? Number(p.stock_quantity) ?? 0,
    })),
    updated_at: p.updated_at || new Date().toISOString(),
  }));

  if (localProducts) {
    await db.products.clear();
    await db.products.bulkPut(localProducts);
  }
}

export async function seedExchangeRates(): Promise<void> {
  const { data: rates } = await supabase
    .from('exchange_rates')
    .select('*')
    .eq('base_currency', 'USD');

  if (rates) {
    await db.exchangeRates.clear();
    await db.exchangeRates.bulkPut(
      rates.map((r) => ({
        id: r.id,
        target_currency: r.target_currency,
        rate: r.rate,
        fetched_at: r.fetched_at || new Date().toISOString(),
      }))
    );
  }
}
