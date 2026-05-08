export type AdminRole = 'owner' | 'manager';

export interface Profile {
  id: string;
  role: AdminRole;
  full_name: string | null;
  created_at: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'cancelled';

export interface OrderItem {
  product_id?: string;
  productId?: string;
  name: string;
  price_usd: number;
  size: string;
  quantity: number;
  image: string;
}

export interface PendingOrder {
  id: string;
  order_ref: string;
  items: OrderItem[];
  total_usd: number;
  delivery_fee_usd: number;
  status: OrderStatus;
  created_at: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  price_usd: number;
  sizes: string[];
  stock_quantity: number;
  images: string[];
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at?: string;
  // Computed / UI-only fields
  image?: string;
  className?: string;
}

export interface StoreSettings {
  zig_rate: number;
  whatsapp_number: string;
  delivery_fee_usd: number;
  free_delivery_threshold_usd: number;
}

export interface CartItem {
  productId: string;
  name: string;
  size: string;
  price_usd: number;
  image: string;
  quantity: number;
}

export interface DashboardMetrics {
  totalRevenue: number;
  ordersToday: number;
  activeProducts: number;
  lowStockItems: number;
  revenueChange: number;
  ordersTodayChange: number;
}

export interface RevenueDataPoint {
  date: string;
  label: string;
  revenue: number;
}

export interface TopProduct {
  id: string;
  name: string;
  orderCount: number;
  stock: number;
  maxCount: number;
}

export interface InventoryItem extends Product {
  salesLast7Days: number;
  salesLast30Days: number;
  dailyVelocity: number;
  daysUntilStockout: number | null;
  suggestedRestock: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface StoreContext {
  revenue: number;
  totalOrders: number;
  productsInStock: number;
  topSeller: string | null;
  pendingOrdersCount: number;
  zigRate: number;
  lowStockItems: number;
  inventorySnapshot?: Array<{
    name: string;
    stock: number;
    salesLast30Days: number;
  }>;
}

export interface AdminNotification {
  id: string;
  type: 'new_order' | 'low_stock' | 'ai_insight';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}
