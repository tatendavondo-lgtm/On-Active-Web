import Dexie, { type Table } from 'dexie';

export interface LocalProduct {
  id: string;
  name: string;
  category: string;
  sku: string;
  image_url: string;
  variants: {
    id: string;
    name: string;
    sku: string;
    price: number;
    stock: number;
  }[];
  updated_at: string;
}

export interface LocalSalesmanOrder {
  id: string;
  store_id: string;
  salesman_id: string;
  salesman_name: string;
  customer_name?: string;
  items: any[];
  subtotal: number;
  item_count: number;
  notes?: string;
  status: 'pending' | 'accepted' | 'modified' | 'completed' | 'cancelled';
  created_at: string;
  accepted_at?: string;
  completed_at?: string;
  synced: boolean;
  device_id: string;
}

export interface LocalOrder {
  id: string;
  order_number: string;
  source: 'walk_in' | 'salesman' | 'online';
  fulfillment: 'immediate' | 'collection' | 'delivery';
  status: string;
  salesman_id?: string;
  salesman_order_id?: string;
  items: any[];
  payments: any[];
  subtotal: number;
  auto_discount_applied: boolean;
  auto_discount_amount: number;
  manual_discount_amount: number;
  total_discount: number;
  total: number;
  customer_id?: string;
  employee_id: string;
  shift_id: string;
  store_id: string;
  exchange_rate_zig?: number;
  exchange_rate_zar?: number;
  created_at: string;
  synced: boolean;
  device_id: string;
}

export interface SyncQueueItem {
  id?: number;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: any;
  created_at: string;
  attempts: number;
  last_error?: string;
}

export interface PosCustomer {
  id: string;
  full_name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  source?: string;
  created_at: string;
}

export interface PosShift {
  id: string;
  store_id: string;
  employee_id: string;
  device_id: string;
  opened_at: string;
  closed_at?: string;
  opening_cash: number;
  closing_cash?: number;
  expected_cash?: number;
  cash_difference?: number;
  status: 'open' | 'closed';
  notes?: string;
}

export interface LocalExchangeRate {
  id: string;
  target_currency: string;
  rate: number;
  fetched_at: string;
}

export interface SyncErrorItem extends SyncQueueItem {
  failed_at: string;
}

class PosDatabase extends Dexie {
  products!: Table<LocalProduct>;
  salesmanOrders!: Table<LocalSalesmanOrder>;
  orders!: Table<LocalOrder>;
  syncQueue!: Table<SyncQueueItem>;
  syncErrors!: Table<SyncErrorItem>;
  exchangeRates!: Table<LocalExchangeRate>;
  customers!: Table<PosCustomer>;
  shifts!: Table<PosShift>;

  constructor() {
    super('OnActivePOS');
    this.version(8).stores({
      products: 'id, name, category, sku, updated_at',
      salesmanOrders: 'id, store_id, salesman_id, status, created_at',
      orders: 'id, order_number, source, fulfillment, status, synced, created_at, shift_id, store_id',
      syncQueue: '++id, table, operation, created_at',
      syncErrors: '++id, table, operation, created_at, failed_at',
      exchangeRates: 'id, target_currency',
      customers: 'id, full_name, phone, email',
      shifts: 'id, store_id, employee_id, status'
    });
  }
}

export const db = new PosDatabase();
