import { db } from './dexie';
import { supabase } from '../config/supabase';
import type { Order } from '../types/order';

// Fields that exist locally but NOT in the remote Supabase tables
const CLIENT_ONLY_FIELDS = ['synced', 'synced_at', 'device_id', 'created_offline'];

// Per-table field whitelist based on actual database columns
const TABLE_COLUMNS: Record<string, string[]> = {
  salesman_orders: ['id', 'store_id', 'salesman_id', 'salesman_name', 'customer_name', 'items', 'subtotal', 'item_count', 'notes', 'status', 'created_at'],
  shifts: ['id', 'store_id', 'employee_id', 'opened_at', 'closed_at', 'opening_cash', 'closing_cash', 'expected_cash', 'cash_difference', 'status', 'notes'],
  pos_orders: ['id', 'order_number', 'store_id', 'employee_id', 'salesman_id', 'salesman_order_id', 'shift_id', 'source', 'fulfillment', 'status', 'subtotal', 'total_discount', 'total', 'currency', 'exchange_rate_zig', 'exchange_rate_zar', 'created_at', 'completed_at'],
  pos_order_items: ['id', 'order_id', 'product_id', 'variant_id', 'product_name', 'variant_name', 'quantity', 'unit_price', 'line_total'],
  pos_payments: ['id', 'order_id', 'method', 'amount_usd', 'amount_local', 'local_currency', 'exchange_rate_used', 'reference', 'status', 'created_at'],
  customers: ['id', 'full_name', 'phone', 'email', 'address', 'notes', 'source', 'created_at'],
  online_order_bridge: ['id', 'webstore_order_id', 'pos_order_id', 'store_id', 'fulfillment', 'status', 'assigned_at', 'accepted_at', 'ready_at', 'completed_at', 'customer_name', 'customer_phone', 'customer_email', 'items', 'total', 'order_ref'],
  products: ['id', 'stock_quantity'], 
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
      if (item.table === 'products' && item.operation === 'update' && item.data.decrement) {
        const productId = item.data.product_id;
        const variantId = item.data.variant_id;
        const storeId = item.data.store_id;
        const decrement = item.data.decrement;

        // 1. Update Global Products Table (Total Stock)
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

        // 2. Update Branch Store Inventory (Specific Variant Stock)
        if (storeId) {
          // If we have a variantId, update that specific combo
          if (variantId) {
            const { data: currentInv } = await supabase
              .from('store_inventory')
              .select('quantity')
              .eq('store_id', storeId)
              .eq('variant_id', variantId)
              .single();

            if (currentInv) {
              const newInvQty = Math.max(0, (currentInv.quantity ?? 0) - decrement);
              await supabase
                .from('store_inventory')
                .update({ quantity: newInvQty, updated_at: new Date().toISOString() })
                .eq('store_id', storeId)
                .eq('variant_id', variantId);
            }
          } else {
            // Fallback for non-variant products
            const { data: currentInv } = await supabase
              .from('store_inventory')
              .select('quantity')
              .eq('store_id', storeId)
              .eq('product_id', productId)
              .is('variant_id', null)
              .single();

            if (currentInv) {
              const newInvQty = Math.max(0, (currentInv.quantity ?? 0) - decrement);
              await supabase
                .from('store_inventory')
                .update({ quantity: newInvQty, updated_at: new Date().toISOString() })
                .eq('store_id', storeId)
                .eq('product_id', productId)
                .is('variant_id', null);
            }
          }
        }
      } else if (item.operation === 'insert') {
        // Strip client-only fields that don't exist in Supabase tables
        const cleaned = sanitizeForRemote(item.table, item.data);
        const { error } = await supabase.from(item.table).insert(cleaned);
        if (error) {
          // Treat duplicate key constraint error (23505) as success since it's already remotely saved
          if (error.code === '23505') {
            console.warn(`Unique constraint violation (already synced) for ${item.table}:`, item.data.id);
          } else {
            throw error;
          }
        }
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

    const webstoreUrl = import.meta.env.VITE_WEBSTORE_URL || '';

    const localProducts = products.map((p) => {
      let imageUrl = p.image_url || p.images?.[0] || '';
      
      // If it's a relative path starting with /, prepend the webstore URL
      if (imageUrl.startsWith('/') && webstoreUrl) {
        // Using a simple replace for space is enough for filenames.
        imageUrl = `${webstoreUrl}${imageUrl.replace(/ /g, '%20')}`;
      }

      return {
        id: p.id,
        name: p.name,
        category: p.category || 'uncategorized',
        sku: p.sku || '',
        image_url: imageUrl,
        variants: (p.product_variants || []).map((v: any) => {
          const invKey = `${p.id}-${v.id}`;
          let variantName = v.name;
          if (v.size && v.color) {
            variantName = `${v.size} / ${v.color}`;
          } else if (v.size) {
            variantName = v.size;
          }

          return {
            id: v.id,
            name: variantName || 'Standard',
            sku: v.sku || p.sku || '',
            price: Number(v.price) || Number(p.price_usd) || 0,
            stock: invMap[invKey] !== undefined ? invMap[invKey] : (Number(p.stock_quantity) || 0),
          };
        }),
        updated_at: p.updated_at || new Date().toISOString(),
      };
    });

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
          items: typeof so.items === 'string' ? JSON.parse(so.items) : (so.items || []),
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

  // 3.5 Pull customers (all of them, as they are not store-scoped in the schema)
  try {
    const { data: customers, error: custErr } = await supabase
      .from('customers')
      .select('*');

    if (custErr) throw custErr;
    if (customers) {
      await db.customers.bulkPut(customers);
    }
  } catch (err) {
    console.warn('Failed to pull customers:', err);
  }

  // 4. Pull online orders via the bridge
  try {
    const { data: onlineOrders, error: ooErr } = await supabase
      .from('online_order_bridge')
      .select('*')
      .eq('store_id', storeId)
      .in('status', ['pending', 'confirmed', 'preparing', 'ready']);

    if (ooErr) throw ooErr;

    if (onlineOrders && onlineOrders.length > 0) {
      // Fetch the actual webstore order details for each bridged order (as fallback only)
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

        // Use bridged columns directly as first choice, fall back to webstore columns
        const rawItems = bo.items || webOrder?.items || [];
        const items = rawItems.map((item: any) => {
          let variantDesc = '';
          if (item.size && item.color) {
            variantDesc = `${item.size} / ${item.color}`;
          } else if (item.size) {
            variantDesc = item.size;
          } else if (item.variant_name) {
            variantDesc = item.variant_name;
          }

          return {
            id: crypto.randomUUID(),
            product_id: item.productId || item.product_id || '',
            product_name: item.name || item.product_name || 'Unknown',
            variant_name: variantDesc,
            quantity: item.quantity || 1,
            unit_price: Number(item.price) || Number(item.price_usd) || 0,
            discount_amount: 0,
            line_total: (Number(item.price) || Number(item.price_usd) || 0) * (item.quantity || 1),
          };
        });

        const total = Number(bo.total) || Number(webOrder?.total_usd) || 0;
        const orderRef = bo.order_ref || webOrder?.order_ref || (typeof bo.id === 'string' ? `ONLINE-${bo.id.slice(0, 8)}` : `ONLINE-${Math.random().toString(36).substring(7)}`);
        const customerName = bo.customer_name || webOrder?.customer_name || 'Online Customer';

        if (!exists) {
          console.log(`Ingesting online order: ${orderRef}`);
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
        } else {
          // Update items, total, and status if they changed or were previously 0
          const needsItemUpdate = !exists.items || exists.items.length === 0 || exists.total === 0;
          const updates: any = {};
          
          if (exists.status !== bo.status) {
            updates.status = bo.status;
          }
          if (needsItemUpdate && items.length > 0) {
            updates.items = items;
            updates.total = total;
            updates.subtotal = total;
            if (updates.payments && updates.payments[0]) {
              updates.payments[0].amount_usd = total;
            }
          }
          if (exists.order_number.startsWith('ONLINE-') && !orderRef.startsWith('ONLINE-')) {
            updates.order_number = orderRef;
          }

          if (Object.keys(updates).length > 0) {
            await db.orders.update(bo.id, updates);
          }
        }
      }
    }
  } catch (err) {
    console.warn('Failed to pull online orders:', err);
  }
}
