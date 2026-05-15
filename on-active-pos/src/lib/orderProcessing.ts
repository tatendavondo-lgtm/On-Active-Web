import { db } from '../db/dexie';
import { generateOrderNumber } from './orderNumber';
import type { CartItem, AutoDiscount } from '../types/cart';
import type { Payment, Order } from '../types/order';

interface ProcessOrderParams {
  storeId: string;
  employeeId: string;
  deviceId: string;
  source: 'walk_in' | 'salesman';
  salesmanId?: string;
  salesmanOrderId?: string;
  items: CartItem[];
  payments: Payment[];
  subtotal: number;
  autoDiscount: AutoDiscount;
  manualDiscountAmount: number;
  manualDiscountType: 'percentage' | 'fixed' | null;
  manualDiscountValue?: number;
  totalDiscount: number;
  taxAmount: number;
  total: number;
  exchangeRateZig: number;
  exchangeRateZar: number;
}

export async function processOrder(params: ProcessOrderParams) {
  const { storeId } = params;
  const orderNumber = await generateOrderNumber(storeId);
  const now = new Date().toISOString();
  const orderId = crypto.randomUUID();

  // 1. Build PosOrder object
  const order: Order = {
    id: orderId,
    order_number: orderNumber,
    store_id: storeId,
    employee_id: params.employeeId,
    salesman_id: params.salesmanId,
    salesman_order_id: params.salesmanOrderId,
    shift_id: 'mock-shift', // TODO: From session
    source: params.source,
    fulfillment: 'immediate',
    status: 'completed',
    items: params.items,
    payments: params.payments,
    subtotal: params.subtotal,
    auto_discount_applied: params.autoDiscount.applied,
    auto_discount_amount: params.autoDiscount.amount,
    manual_discount_amount: params.manualDiscountAmount,
    manual_discount_type: params.manualDiscountType || undefined,
    manual_discount_value: params.manualDiscountValue,
    total_discount: params.totalDiscount,
    tax_amount: params.taxAmount,
    total: params.total,
    currency: 'USD',
    exchange_rate_zig: params.exchangeRateZig,
    exchange_rate_zar: params.exchangeRateZar,
    created_at: now,
    updated_at: now,
    completed_at: now,
    created_offline: true,
    synced: false,
    device_id: params.deviceId,
  };

  // 2. Write to local Dexie orders table
  await db.orders.add(order as any); // Types might be slightly off in dexie schema vs order interface, ignore for now

  // 3. Mark salesman order as completed if applicable
  if (params.salesmanOrderId) {
    await db.salesmanOrders.update(params.salesmanOrderId, { status: 'completed' });
    await db.syncQueue.add({
      table: 'salesman_orders',
      operation: 'update',
      data: { id: params.salesmanOrderId, status: 'completed' },
      created_at: now,
      attempts: 0
    });
  }

  // 4. Queue for sync
  await queueOrderForSync(order);

  // Return the processed order for receipt preview
  return order;
}

export async function queueOrderForSync(order: Order): Promise<void> {
  const now = new Date().toISOString();

  // 1. Queue pos_order
  await db.syncQueue.add({
    table: 'pos_orders',
    operation: 'insert',
    data: {
      id: order.id,
      order_number: order.order_number,
      store_id: order.store_id,
      employee_id: order.employee_id,
      salesman_id: order.salesman_id || null,
      salesman_order_id: order.salesman_order_id || null,
      shift_id: order.shift_id,
      customer_id: order.customer_id || null,
      source: order.source,
      fulfillment: order.fulfillment,
      status: order.status,
      subtotal: order.subtotal,
      auto_discount_applied: order.auto_discount_applied,
      auto_discount_amount: order.auto_discount_amount,
      manual_discount_amount: order.manual_discount_amount,
      total_discount: order.total_discount,
      tax_amount: order.tax_amount,
      total: order.total,
      currency: order.currency,
      exchange_rate_zig: order.exchange_rate_zig,
      exchange_rate_zar: order.exchange_rate_zar,
      created_at: order.created_at,
      created_offline: true,
      device_id: order.device_id,
    },
    created_at: now,
    attempts: 0,
  });

  // 2. Queue items
  for (const item of order.items) {
    await db.syncQueue.add({
      table: 'pos_order_items',
      operation: 'insert',
      data: {
        id: crypto.randomUUID(), // Local only items generated their own IDs when adding to cart
        order_id: order.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        product_name: item.product_name,
        variant_name: item.variant_name,
        sku: item.sku,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_amount: item.discount_amount || 0,
        line_total: item.line_total,
      },
      created_at: now,
      attempts: 0,
    });
  }

  // 3. Queue payments
  for (const payment of order.payments) {
    await db.syncQueue.add({
      table: 'pos_payments',
      operation: 'insert',
      data: {
        ...payment,
        order_id: order.id,
      },
      created_at: now,
      attempts: 0,
    });
  }

  // 4. Queue inventory decrements (Directly to main products table + store inventory)
  for (const item of order.items) {
    await db.syncQueue.add({
      table: 'products',
      operation: 'update',
      data: {
        id: item.product_id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        store_id: order.store_id,
        decrement: item.quantity,
      },
      created_at: now,
      attempts: 0,
    });
  }
}
