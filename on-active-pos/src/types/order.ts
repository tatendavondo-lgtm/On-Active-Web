export interface OrderItem {
  id: string;
  product_id: string;
  variant_id?: string;
  product_name: string;
  variant_name?: string;
  sku?: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  line_total: number;
  refunded_quantity?: number;
}

export interface Payment {
  id: string;
  method: 'cash' | 'ecocash' | 'innbucks' | 'card' | 'bank_transfer' | 'online_payment';
  amount_usd: number;
  amount_local?: number;
  local_currency?: 'ZIG' | 'ZAR';
  exchange_rate_used?: number;
  reference?: string;
  tendered?: number;
  change_given?: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  shift_id?: string;
}

export interface Order {
  id: string;
  order_number: string;
  store_id: string;
  employee_id: string;
  salesman_id?: string;
  salesman_order_id?: string;
  shift_id: string;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  webstore_order_id?: string;
  source: 'walk_in' | 'salesman' | 'online';
  fulfillment: 'immediate' | 'collection' | 'delivery';
  status: string;
  items: OrderItem[];
  payments: Payment[];
  subtotal: number;
  auto_discount_applied: boolean;
  auto_discount_amount: number;
  manual_discount_amount: number;
  manual_discount_type?: 'percentage' | 'fixed';
  manual_discount_value?: number;
  total_discount: number;
  tax_amount: number;
  total: number;
  currency: string;
  exchange_rate_zig?: number;
  exchange_rate_zar?: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  created_offline: boolean;
  synced: boolean;
  device_id: string;
}

// Salesman order (pre-payment, sent to till)
export interface SalesmanOrder {
  id: string;
  store_id: string;
  salesman_id: string;
  salesman_name: string;
  customer_name?: string;
  items: OrderItem[];
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
