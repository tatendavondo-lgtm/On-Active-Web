import { db } from './dexie';
import { supabase } from '../config/supabase';
import type { Order } from '../types/order';

// Fields that exist locally but NOT in the remote Supabase tables
const CLIENT_ONLY_FIELDS = ['synced', 'synced_at', 'device_id', 'created_offline'];

// Per-table field whitelist based on actual database columns
const TABLE_COLUMNS: Record<string, string[]> = {
  salesman_orders: ['id', 'store_id', 'salesman_id', 'salesman_name', 'customer_name', 'items', 'subtotal', 'item_count', 'notes', 'status', 'created_at'],
  pos_shifts: ['id', 'store_id', 'employee_id', 'opened_at', 'closed_at', 'opening_cash', 'closing_cash', 'actual_cash', 'status', 'created_at'],
  pos_orders: ['id', 'order_number', 'store_id', 'employee_id', 'salesman_id', 'salesman_order_id', 'shift_id', 'customer_id', 'source', 'fulfillment', 'status', 'subtotal', 'total_discount', 'total', 'currency', 'exchange_rate_zig', 'exchange_rate_zar', 'created_at', 'completed_at'],
  pos_order_items: ['id', 'order_id', 'product_id', 'variant_id', 'product_name', 'variant_name', 'quantity', 'unit_price', 'line_total'],
  pos_payments: ['id', 'order_id', 'method', 'amount_usd', 'status', 'created_at'],
  pos_customers: ['id', 'store_id', 'name', 'phone', 'email', 'address', 'loyalty_points', 'notes', 'created_at', 'updated_at'],
  products: ['id', 'stock_quantity'], // For inventory updates
};

function sanitizeForRemote(table: string, data: any): any {
  const whitelist = TABLE_COLUMNS[table];
  if (whitelist) {
    // Only include fields that exist in the remote table
    const cleaned: any = {};
    for (const key of whitelist) {
      if (data[key] !== undefined) cleaned[key] = data[key];
    }
    return cleaned;
  }
  // Fallback: just strip known client-only fields
  const cleaned = { ...data };
  for (const field of CLIENT_ONLY_FIELDS) {
    delete cleaned[field];
  }
  return cleaned;
}

export async function processSyncQueue(): Promise<{ synced: number; failed: number }> {
  // ONE-TIME CLEANUP (User requested)
  // We'll just run it once and let it skip anything else
  const items = await db.syncQueue.orderBy('id').toArray();
  let synced = 0;
  let failed = 0;

  for (const item of items) {
    if ((item.attempts ?? 0) >= 5) {
      console.warn(`Skipping permanently failed sync item:`, item.table, item.last_error);
      await db.syncQueue.delete(item.id!); // Actually delete it so it stops looping
      continue;
    }

    try {
      if (item.table === 'store_inventory' || (item.table === 'products' && item.operation === 'update' && item.data.decrement)) {
        const productId = item.data.product_id;
        const variantId = item.data.variant_id;
        const storeId = item.data.store_id;
        const decrement = item.data.decrement;

        // 1. Update Global Products Table
        const { data: currentProd } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', productId)
          .single();

        if (currentProd) {
          const newProdQty = Math.max(0, (currentProd.stock_quantity ?? 0) - decrement);
          await supabase
            .from('products')
            .update({ stock_quantity: newProdQty, updated_at: new Date().toISOString() })
            .eq('id', productId);
        }

        // 2. Update Branch Store Inventory
        if (storeId) {
          let invQuery = supabase.from('store_inventory').select('quantity').eq('store_id', storeId).eq('product_id', productId);
          if (variantId) invQuery = invQuery.eq('variant_id', variantId);
          else invQuery = invQuery.is('variant_id', null);

          const { data: currentInv } = await invQuery.single();

          if (currentInv) {
            const newInvQty = Math.max(0, (currentInv.quantity ?? 0) - decrement);
            let updateInvQuery = supabase.from('store_inventory').update({ quantity: newInvQty, updated_at: new Date().toISOString() }).eq('store_id', storeId).eq('product_id', productId);
            if (variantId) updateInvQuery = updateInvQuery.eq('variant_id', variantId);
            else updateInvQuery = updateInvQuery.is('variant_id', null);
            await updateInvQuery;
          }
        }
      } else if (item.operation === 'insert') {
        // Strip client-only fields that don't exist in Supabase tables
        const cleaned = sanitizeForRemote(item.table, item.data);
        const { error } = await supabase.from(item.table).insert(cleaned);
        if (error) throw error;
      } else if (item.operation === 'update') {
        const cleaned = sanitizeForRemote(item.table, item.data);
        const { id, ...updates } = cleaned;
        const { error } = await supabase.from(item.table).update(updates).eq('id', id);
        if (error) throw error;
      }

      // Success
      await db.syncQueue.delete(item.id!);
      
      // Update local status
      if (item.table === 'pos_orders') {
        await db.orders.update(item.data.id, { synced: true, synced_at: new Date().toISOString() } as any);
      } else if (item.table === 'salesman_orders') {
        await db.salesmanOrders.update(item.data.id, { synced: true, synced_at: new Date().toISOString() } as any);
      }
      
      synced++;
    } catch (err: any) {
      console.error(`Sync failed for ${item.table} ${item.operation}:`, err);
      await db.syncQueue.update(item.id!, {
        attempts: item.attempts + 1,
        last_error: err.message || 'Unknown error',
      });
      failed++;
    }
  }

  return { synced, failed };
}

export async function pullUpdates(storeId: string): Promise<void> {
  // 0. Pull product catalog and store-specific inventory
  const [
    { data: products },
    { data: inventory }
  ] = await Promise.all([
    supabase.from('products').select('*, product_variants(*)'),
    supabase.from('store_inventory').select('*').eq('store_id', storeId)
  ]);

  if (products) {
    const invMap: Record<string, number> = {};
    (inventory || []).forEach(item => {
      const key = item.variant_id ? `${item.product_id}-${item.variant_id}` : item.product_id;
      invMap[key] = item.quantity;
    });

    const localProducts = products.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category || 'uncategorized',
      sku: p.sku || '',
      image_url: p.image_url || p.images?.[0] || '',
      variants: (p.product_variants || []).map((v: any) => {
        const invKey = `${p.id}-${v.id}`;
        return {
          id: v.id,
          name: v.name || 'Standard',
          sku: v.sku || p.sku || '',
          price: Number(v.price) || Number(p.price_usd) || 0,
          stock: invMap[invKey] !== undefined ? invMap[invKey] : (Number(p.stock_quantity) || 0),
        };
      }),
      updated_at: p.updated_at || new Date().toISOString(),
    }));

    if (localProducts.length > 0) {
      // Find products that exist locally but not in the fetched list and delete them
      const newIds = new Set(localProducts.map(p => p.id));
      const existing = await db.products.toArray();
      const toDelete = existing.filter(p => !newIds.has(p.id)).map(p => p.id);
      
      if (toDelete.length > 0) {
        await db.products.bulkDelete(toDelete);
      }
      
      // Update or insert remaining products
      await db.products.bulkPut(localProducts);
    }
  }

  // 1. Pull new salesman orders
  const { data: salesmanOrders } = await supabase
    .from('salesman_orders')
    .select('*')
    .eq('store_id', storeId)
    .in('status', ['pending', 'accepted']);

  if (salesmanOrders) {
    for (const so of salesmanOrders) {
      const exists = await db.salesmanOrders.get(so.id);
      if (!exists) {
        await db.salesmanOrders.add({
          ...so,
          salesman_name: so.salesman_name || 'Unknown',
          synced: true,
          device_id: '',
        });
      } else if (exists.status !== so.status) {
        await db.salesmanOrders.update(so.id, { status: so.status });
      }
    }
  }

  // 2. Pull inventory updates (handled above in 0 now, but we can keep it as a fallback or remove it)
  // Removing redundant block 2 as it's now integrated into block 0 for better consistency.

  // 3. Pull exchange rates
  const { data: rates } = await supabase
    .from('exchange_rates')
    .select('*')
    .eq('base_currency', 'USD');

  if (rates) {
    await db.exchangeRates.clear();
    for (const r of rates) {
      await db.exchangeRates.put({
        id: r.id,
        target_currency: r.target_currency,
        rate: r.rate,
        fetched_at: r.fetched_at || new Date().toISOString(),
      });
    }
  }

  // 3.5 Pull customers
  const { data: customers } = await supabase
    .from('pos_customers')
    .select('*')
    .eq('store_id', storeId);

  if (customers) {
    await db.customers.bulkPut(customers);
  }

  // 4. Pull online orders via the bridge
  const { data: onlineOrders } = await supabase
    .from('online_order_bridge')
    .select('*')
    .eq('store_id', storeId)
    .in('status', ['pending', 'confirmed', 'preparing', 'ready']);

  if (onlineOrders && onlineOrders.length > 0) {
    // Fetch the actual webstore order details for each bridged order
    const webOrderIds = onlineOrders.map(bo => bo.webstore_order_id).filter(Boolean);
    const { data: webOrders } = webOrderIds.length > 0
      ? await supabase
          .from('pending_orders')
          .select('id, order_ref, items, total_usd, delivery_fee_usd, status')
          .in('id', webOrderIds)
      : { data: [] };

    const webOrderMap: Record<string, any> = {};
    for (const wo of webOrders ?? []) {
      webOrderMap[wo.id] = wo;
    }

    for (const bo of onlineOrders) {
      const exists = await db.orders.get(bo.id);
      const webOrder = webOrderMap[bo.webstore_order_id];

      // Build items from web order data
      const items = (webOrder?.items ?? []).map((item: any) => ({
        id: crypto.randomUUID(),
        product_id: item.productId || item.product_id || '',
        product_name: item.name || 'Unknown',
        variant_name: item.size || '',
        quantity: item.quantity || 1,
        unit_price: item.price_usd || 0,
        discount_amount: 0,
        line_total: (item.price_usd || 0) * (item.quantity || 1),
      }));

      const total = webOrder?.total_usd ?? 0;
      const orderRef = webOrder?.order_ref ?? `ONLINE-${bo.id.slice(0, 8)}`;

      if (!exists) {
        const o: Order = {
          id: bo.id,
          order_number: orderRef,
          source: 'online',
          fulfillment: bo.fulfillment,
          status: bo.status,
          salesman_id: undefined,
          salesman_order_id: undefined,
          items,
          payments: [{ id: crypto.randomUUID(), method: 'online_payment', amount_usd: total, status: 'completed', order_id: bo.id } as any],
          subtotal: total,
          auto_discount_applied: false,
          auto_discount_amount: 0,
          manual_discount_amount: 0,
          total_discount: 0,
          tax_amount: 0,
          total,
          currency: 'USD',
          employee_id: '',
          shift_id: '',
          store_id: storeId,
          created_at: bo.assigned_at,
          updated_at: bo.assigned_at,
          created_offline: false,
          synced: true,
          device_id: '',
        };
        await db.orders.add(o as any);
      } else if (exists.status !== bo.status) {
        // Update status if changed remotely
        await db.orders.update(bo.id, { status: bo.status } as any);
      }
    }
  }
}
