import { db } from '../db/dexie';
import { processSyncQueue } from '../db/sync';
import { generateOrderNumber } from './orderNumber';
import type { CartItem, AutoDiscount } from '../types/cart';
import type { Payment, Order } from '../types/order';

import { generateUUID } from './uuid';

interface ProcessOrderParams {
  storeId: string;
  employeeId: string;
  shiftId: string;
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
  const { storeId, shiftId } = params;
  const orderNumber = await generateOrderNumber(storeId);
  const now = new Date().toISOString();
  const orderId = generateUUID();

  // 1. Build PosOrder object
  const order: Order = {
    id: orderId,
    order_number: orderNumber,
    store_id: storeId,
    employee_id: params.employeeId,
    salesman_id: params.salesmanId,
    salesman_order_id: params.salesmanOrderId,
    shift_id: shiftId,
    source: params.source,
    fulfillment: 'immediate',
    status: 'completed',
    items: params.items.map(it => ({ ...it, id: it.id || generateUUID() })),
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

  // 4. Queue for sync & immediately flush if online
  await queueOrderForSync(order);
  processSyncQueue().catch(err => console.warn('Immediate order sync deferred to background queue:', err));

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
      manual_discount_type: order.manual_discount_type || null,
      manual_discount_value: order.manual_discount_value ?? null,
      total_discount: order.total_discount,
      tax_amount: order.tax_amount,
      total: order.total,
      currency: order.currency,
      exchange_rate_zig: order.exchange_rate_zig,
      exchange_rate_zar: order.exchange_rate_zar,
      created_at: order.created_at,
      updated_at: order.updated_at || order.created_at,
      completed_at: order.completed_at || order.created_at,
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
        id: item.id || generateUUID(),
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
    // A. Local stock deduction for immediate UI updates
    try {
      const product = await db.products.get(item.product_id);
      if (product) {
        if (item.variant_id) {
          const vIndex = product.variants.findIndex(v => v.id === item.variant_id);
          if (vIndex !== -1) {
            product.variants[vIndex].stock = Math.max(0, product.variants[vIndex].stock - item.quantity);
          }
        } else {
          // If no variant_id, deduct from the first variant (which acts as base stock)
          if (product.variants.length > 0) {
            product.variants[0].stock = Math.max(0, product.variants[0].stock - item.quantity);
          }
        }
        await db.products.put(product);
      }
    } catch (err) {
      console.warn('Failed to update local inventory for item', item.product_id, err);
    }

    // B. Queue for remote sync
    await db.syncQueue.add({
      table: 'products',
      operation: 'update',
      data: {
        id: item.product_id,
        product_id: item.product_id,
        variant_id: item.variant_id || null, // Ensure variant_id is passed if it exists
        store_id: order.store_id,
        decrement: item.quantity,
      },
      created_at: now,
      attempts: 0,
    });
  }

  // Immediately flush refund & restock to Supabase if online
  processSyncQueue().catch(err => console.warn('Immediate refund sync deferred to background queue:', err));
}

export interface ProcessRefundParams {
  order: Order;
  refundItems: { item: any; returnQuantity: number }[];
  refundMethod: 'cash' | 'ecocash' | 'innbucks' | 'card';
  reason: string;
  refundTotalUsd: number;
  shiftId: string;
}

export async function processRefund(params: ProcessRefundParams) {
  const { order, refundItems, refundMethod, reason, refundTotalUsd, shiftId } = params;
  const now = new Date().toISOString();
  const paymentId = generateUUID();

  // 1. Determine new status
  let isFullRefund = true;
  const returnMap = new Map();
  for (const r of refundItems) returnMap.set(r.item.id, r.returnQuantity);

  for (const item of order.items) {
    const returningNow = returnMap.get(item.id) || 0;
    const previouslyRefunded = item.refunded_quantity || 0;
    const totalRefunded = returningNow + previouslyRefunded;
    
    if (totalRefunded < item.quantity) {
      isFullRefund = false;
      break;
    }
  }

  const newStatus = isFullRefund ? 'refunded' : 'partially_refunded';

  // 2. Add negative payment record
  const refundPayment: Payment = {
    id: paymentId,
    method: refundMethod,
    amount_usd: -Math.abs(refundTotalUsd), // Ensure it's negative
    status: 'refunded',
    reference: reason, // Store reason in reference
    shift_id: shiftId
  };

  // 3. Update local Dexie order
  const updatedOrder = await db.orders.get(order.id);
  if (updatedOrder) {
    const payments = updatedOrder.payments || [];
    payments.push(refundPayment);
    
    // Update items refunded_quantity
    const newItems = updatedOrder.items.map(item => {
      const returning = returnMap.get(item.id) || 0;
      if (returning > 0) {
        return { ...item, refunded_quantity: (item.refunded_quantity || 0) + returning };
      }
      return item;
    });

    await db.orders.update(order.id, {
      status: newStatus,
      payments,
      items: newItems,
      updated_at: now
    } as any);
  }

  // 4. Queue status update and payment sync
  await db.syncQueue.add({
    table: 'pos_orders',
    operation: 'update',
    data: { id: order.id, status: newStatus, updated_at: now },
    created_at: now,
    attempts: 0
  });

  await db.syncQueue.add({
    table: 'pos_payments',
    operation: 'insert',
    data: {
      ...refundPayment,
      order_id: order.id,
      created_at: now
    },
    created_at: now,
    attempts: 0
  });

  // 5. Handle Restocking Local & Remote
  for (const { item, returnQuantity } of refundItems) {
    if (returnQuantity <= 0) continue;

    // Queue update for the specific order item so remote DB tracks refunded_quantity
    await db.syncQueue.add({
      table: 'pos_order_items',
      operation: 'update',
      data: {
        id: item.id,
        refunded_quantity: (item.refunded_quantity || 0) + returnQuantity
      },
      created_at: now,
      attempts: 0
    });

    // A. Local stock increment
    try {
      const product = await db.products.get(item.product_id);
      if (product) {
        if (item.variant_id) {
          const vIndex = product.variants.findIndex(v => v.id === item.variant_id);
          if (vIndex !== -1) {
            product.variants[vIndex].stock += returnQuantity;
          }
        } else {
          if (product.variants.length > 0) {
            product.variants[0].stock += returnQuantity;
          }
        }
        await db.products.put(product);
      }
    } catch (err) {
      console.warn('Failed to update local inventory for returned item', item.product_id, err);
    }

    // B. Queue for remote sync (increment)
    await db.syncQueue.add({
      table: 'products',
      operation: 'update',
      data: {
        id: item.product_id,
        product_id: item.product_id,
        variant_id: item.variant_id || null,
        store_id: order.store_id,
        increment: returnQuantity,
      },
      created_at: now,
      attempts: 0,
    });
  }
}
