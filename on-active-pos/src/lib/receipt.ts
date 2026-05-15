import type { Order } from '../types/order';

export interface ReceiptData {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  orderNumber: string;
  date: string;
  time: string;
  cashier: string;
  salesman?: string;
  items: {
    name: string;
    variant?: string;
    qty: number;
    unitPrice: number;
    lineTotal: number;
  }[];
  subtotal: number;
  autoDiscount?: {
    percentage: number;
    amount: number;
  };
  manualDiscount?: {
    type: 'percentage' | 'fixed';
    value: number;
    amount: number;
  };
  totalDiscount: number;
  total: number;
  payments: {
    method: string;
    amount: number;
    currency: string;
    localAmount?: number;
    exchangeRate?: number;
    reference?: string;
  }[];
  cashTendered?: number;
  cashTenderedCurrency?: string;
  changeGiven?: number;
  changeCurrency?: string;
  exchangeRates: {
    ZIG: number;
    ZAR: number;
  };
  footer: string;
}

export function transformOrderToReceipt(order: Order, storeInfo: any, cashierName: string, salesmanName?: string): ReceiptData {
  const dateObj = new Date(order.created_at);
  
  return {
    storeName: storeInfo.name,
    storeAddress: storeInfo.address || 'CBD, Harare',
    storePhone: storeInfo.phone || '+263 242 000 000',
    orderNumber: order.order_number,
    date: dateObj.toLocaleDateString(),
    time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    cashier: cashierName,
    salesman: salesmanName,
    items: order.items.map(item => ({
      name: item.product_name,
      variant: item.variant_name,
      qty: item.quantity,
      unitPrice: item.unit_price,
      lineTotal: item.line_total
    })),
    subtotal: order.subtotal,
    autoDiscount: order.auto_discount_applied ? {
      percentage: 2, // Hardcoded per requirement
      amount: order.auto_discount_amount
    } : undefined,
    manualDiscount: order.manual_discount_type ? {
      type: order.manual_discount_type as any,
      value: order.manual_discount_value || 0,
      amount: order.manual_discount_amount
    } : undefined,
    totalDiscount: order.total_discount,
    total: order.total,
    payments: order.payments.map(p => ({
      method: p.method,
      amount: p.amount_usd,
      currency: p.local_currency || 'USD',
      localAmount: p.amount_local,
      exchangeRate: p.exchange_rate_used,
      reference: p.reference
    })),
    exchangeRates: {
      ZIG: order.exchange_rate_zig || 26.5,
      ZAR: order.exchange_rate_zar || 18.2
    },
    footer: 'Thank you for shopping at On Active!💪\nReturns within 7 days with this receipt.'
  };
}
