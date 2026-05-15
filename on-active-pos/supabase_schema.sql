-- =====================================================
-- STORES & EMPLOYEES
-- =====================================================

CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL,              -- Short code for order numbers (e.g. 'HRE')
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  geofence_radius_meters INTEGER DEFAULT 20,   -- 20m tight geofence
  phone TEXT,
  timezone TEXT DEFAULT 'Africa/Harare',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id),
  full_name TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('salesman', 'till_operator', 'supervisor', 'manager', 'admin')),
  email TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id),
  employee_id UUID REFERENCES employees(id),
  opened_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ,
  opening_cash NUMERIC(10,2) DEFAULT 0,
  closing_cash NUMERIC(10,2),
  expected_cash NUMERIC(10,2),
  cash_difference NUMERIC(10,2),
  notes TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'reconciled'))
);

-- =====================================================
-- SALESMAN ORDERS (submitted from floor → till)
-- =====================================================

CREATE TABLE salesman_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id),
  salesman_id UUID REFERENCES employees(id),
  customer_name TEXT,
  items JSONB NOT NULL,            -- Array of {product_id, variant_id, product_name, variant_name, sku, quantity, unit_price, line_total}
  subtotal NUMERIC(10,2) NOT NULL,
  item_count INTEGER NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'modified', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_offline BOOLEAN DEFAULT false,
  synced_at TIMESTAMPTZ,
  device_id TEXT
);

-- =====================================================
-- POS ORDERS (finalized, paid orders)
-- =====================================================

CREATE TABLE pos_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  store_id UUID REFERENCES stores(id),
  employee_id UUID REFERENCES employees(id),      -- Till operator who processed
  salesman_id UUID REFERENCES employees(id),       -- Salesman who originated (NULL for walk-ins)
  salesman_order_id UUID REFERENCES salesman_orders(id),  -- Link to original salesman order
  shift_id UUID REFERENCES shifts(id),
  customer_id UUID REFERENCES customers(id),
  source TEXT NOT NULL CHECK (source IN ('walk_in', 'salesman', 'online')),
  fulfillment TEXT NOT NULL CHECK (fulfillment IN ('immediate', 'collection', 'delivery')),
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'preparing', 'ready', 'collected', 'out_for_delivery', 'delivered', 'completed', 'cancelled', 'refunded'
  )),
  subtotal NUMERIC(10,2) NOT NULL,
  auto_discount_applied BOOLEAN DEFAULT false,
  auto_discount_amount NUMERIC(10,2) DEFAULT 0,
  manual_discount_amount NUMERIC(10,2) DEFAULT 0,
  manual_discount_type TEXT CHECK (manual_discount_type IN ('percentage', 'fixed', NULL)),
  manual_discount_value NUMERIC(10,2),
  total_discount NUMERIC(10,2) DEFAULT 0,
  tax_amount NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  exchange_rate_zig NUMERIC(12,4),   -- ZIG rate at time of sale
  exchange_rate_zar NUMERIC(12,4),   -- ZAR rate at time of sale
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_offline BOOLEAN DEFAULT false,
  synced_at TIMESTAMPTZ,
  device_id TEXT
);

CREATE TABLE pos_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES pos_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  variant_id UUID,
  product_name TEXT NOT NULL,
  variant_name TEXT,
  sku TEXT,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  discount_amount NUMERIC(10,2) DEFAULT 0,
  line_total NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE pos_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES pos_orders(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK (method IN ('cash', 'ecocash', 'innbucks', 'card', 'bank_transfer', 'online_payment')),
  amount_usd NUMERIC(10,2) NOT NULL,         -- Amount in USD
  amount_local NUMERIC(10,2),                 -- Amount in local currency paid
  local_currency TEXT,                        -- 'ZIG' or 'ZAR' or NULL if USD
  exchange_rate_used NUMERIC(12,4),           -- Rate used for this payment
  reference TEXT,
  tendered NUMERIC(10,2),
  change_given NUMERIC(10,2),
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- CUSTOMERS
-- =====================================================

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  source TEXT DEFAULT 'pos' CHECK (source IN ('pos', 'web', 'both')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- ONLINE ORDERS BRIDGE
-- =====================================================

CREATE TABLE online_order_bridge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webstore_order_id UUID NOT NULL,
  pos_order_id UUID REFERENCES pos_orders(id),
  store_id UUID REFERENCES stores(id),
  fulfillment TEXT NOT NULL CHECK (fulfillment IN ('collection', 'delivery')),
  status TEXT DEFAULT 'pending',
  assigned_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  ready_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- =====================================================
-- INVENTORY (per-store stock)
-- =====================================================

CREATE TABLE store_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id),
  product_id UUID NOT NULL,
  variant_id UUID,
  quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(store_id, product_id, variant_id)
);

-- =====================================================
-- EXCHANGE RATES CACHE
-- =====================================================

CREATE TABLE exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency TEXT DEFAULT 'USD',
  target_currency TEXT NOT NULL,
  rate NUMERIC(12,4) NOT NULL,
  source TEXT DEFAULT 'manual',              -- 'api' or 'manual'
  fetched_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(base_currency, target_currency)
);

-- Seed default rates (will be overwritten by API)
INSERT INTO exchange_rates (base_currency, target_currency, rate, source)
VALUES
  ('USD', 'ZIG', 26.50, 'manual'),
  ('USD', 'ZAR', 18.20, 'manual')
ON CONFLICT (base_currency, target_currency) DO UPDATE
SET rate = EXCLUDED.rate, fetched_at = now();

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_salesman_orders_store ON salesman_orders(store_id);
CREATE INDEX idx_salesman_orders_status ON salesman_orders(status);
CREATE INDEX idx_salesman_orders_created ON salesman_orders(created_at DESC);
CREATE INDEX idx_pos_orders_store ON pos_orders(store_id);
CREATE INDEX idx_pos_orders_source ON pos_orders(source);
CREATE INDEX idx_pos_orders_status ON pos_orders(status);
CREATE INDEX idx_pos_orders_created ON pos_orders(created_at DESC);
CREATE INDEX idx_pos_orders_offline ON pos_orders(created_offline) WHERE created_offline = true;
CREATE INDEX idx_order_items_order ON pos_order_items(order_id);
CREATE INDEX idx_payments_order ON pos_payments(order_id);
CREATE INDEX idx_inventory_store ON store_inventory(store_id);
CREATE INDEX idx_shifts_store ON shifts(store_id);
CREATE INDEX idx_online_bridge_store ON online_order_bridge(store_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE salesman_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE online_order_bridge ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store employees see own store" ON pos_orders
  FOR ALL USING (store_id IN (
    SELECT store_id FROM employees WHERE id = auth.uid()
  ));

CREATE POLICY "Salesman sees own store orders" ON salesman_orders
  FOR ALL USING (store_id IN (
    SELECT store_id FROM employees WHERE id = auth.uid()
  ));

CREATE POLICY "Exchange rates are public" ON exchange_rates
  FOR SELECT USING (true);

-- =====================================================
-- RPC: Inventory decrement (used by sync engine)
-- =====================================================

CREATE OR REPLACE FUNCTION decrement_inventory(
  p_store_id UUID,
  p_product_id UUID,
  p_variant_id UUID,
  p_quantity INTEGER
) RETURNS VOID AS $$
BEGIN
  UPDATE store_inventory
  SET quantity = GREATEST(0, quantity - p_quantity),
      updated_at = now()
  WHERE store_id = p_store_id
    AND product_id = p_product_id
    AND variant_id = p_variant_id;
END;
$$ LANGUAGE plpgsql;
