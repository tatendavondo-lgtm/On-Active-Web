export interface CartItem {
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
}

export interface AutoDiscount {
  applied: boolean;
  percentage: number;    // 2
  threshold: number;     // 50
  amount: number;        // calculated
  original_total: number;
  discounted_total: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  auto_discount: AutoDiscount;
  manual_discount_amount: number;
  manual_discount_type?: 'percentage' | 'fixed';
  manual_discount_value?: number;
  total_discount: number;
  tax_amount: number;
  total: number;
}

export interface HeldTransaction {
  id: string;
  cart: Cart;
  customer_name?: string;
  held_at: string;
  note?: string;
}
