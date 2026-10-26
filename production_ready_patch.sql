-- ============================================================================
-- ON ACTIVE ECOSYSTEM — MASTER PRODUCTION READINESS SQL PATCH
-- Safe & idempotent (can be run multiple times in the Supabase SQL Editor)
-- Ensures 100% alignment between Webstore, Admin Hub, and POS (Web & APK)
-- ============================================================================

-- 1. EMPLOYEES: Ensure PIN, contact columns, and verify_employee_pin RPC exist
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS pin TEXT,
  ADD COLUMN IF NOT EXISTS pin_hash TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

CREATE OR REPLACE FUNCTION verify_employee_pin(p_pin TEXT)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  role TEXT,
  store_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT e.id, e.full_name, e.role, e.store_id
  FROM employees e
  WHERE e.pin = p_pin
    AND e.is_active = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. SALESMAN ORDERS: Ensure salesman_name and device_id exist
ALTER TABLE salesman_orders
  ADD COLUMN IF NOT EXISTS salesman_name TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS device_id TEXT;

-- 3. SHIFTS: Ensure cash reconciliation & terminal columns exist
ALTER TABLE shifts
  ADD COLUMN IF NOT EXISTS actual_cash NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS closing_cash NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS expected_cash NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS cash_difference NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS device_id TEXT;

-- 4. POS ORDERS & ITEMS: Ensure refund statuses ('partially_refunded', 'refunded') and columns exist
ALTER TABLE pos_orders
  ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS device_id TEXT,
  ADD COLUMN IF NOT EXISTS customer_id UUID,
  ADD COLUMN IF NOT EXISTS manual_discount_type TEXT,
  ADD COLUMN IF NOT EXISTS manual_discount_value NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Drop old pos_orders status check constraint if it blocks 'partially_refunded' and re-add complete check
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    WHERE rel.relname = 'pos_orders'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) LIKE '%status%'
  ) LOOP
    EXECUTE format('ALTER TABLE pos_orders DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;

  ALTER TABLE pos_orders
    ADD CONSTRAINT pos_orders_status_check CHECK (status IN (
      'pending', 'confirmed', 'preparing', 'ready', 'collected',
      'out_for_delivery', 'delivered', 'completed', 'cancelled',
      'refunded', 'partially_refunded'
    ));
END $$;

ALTER TABLE pos_order_items
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refunded_quantity INTEGER DEFAULT 0;

-- 5. ONLINE ORDER BRIDGE & PENDING ORDERS: Ensure customer & delivery columns exist
ALTER TABLE online_order_bridge
  ADD COLUMN IF NOT EXISTS order_ref TEXT,
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS customer_phone TEXT,
  ADD COLUMN IF NOT EXISTS customer_email TEXT,
  ADD COLUMN IF NOT EXISTS delivery_address TEXT,
  ADD COLUMN IF NOT EXISTS items JSONB,
  ADD COLUMN IF NOT EXISTS total NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ready_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

ALTER TABLE pending_orders
  ADD COLUMN IF NOT EXISTS delivery_fee_usd NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS needs_bridge BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 6. ATOMIC INVENTORY RPCs (Decrement & Increment for Sales and Refunds)
CREATE OR REPLACE FUNCTION decrement_global_inventory(
  p_product_id UUID,
  p_quantity INT
) RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET stock_quantity = GREATEST(0, COALESCE(stock_quantity, 0) - p_quantity),
      updated_at = now()
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_global_inventory(
  p_product_id UUID,
  p_quantity INT
) RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET stock_quantity = COALESCE(stock_quantity, 0) + p_quantity,
      updated_at = now()
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_inventory(
  p_store_id UUID,
  p_product_id UUID,
  p_variant_id UUID,
  p_quantity INT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO store_inventory (store_id, product_id, variant_id, quantity)
  VALUES (p_store_id, p_product_id, p_variant_id, 0)
  ON CONFLICT (store_id, product_id, variant_id) DO NOTHING;

  UPDATE store_inventory
  SET quantity = GREATEST(0, quantity - p_quantity),
      updated_at = now()
  WHERE store_id = p_store_id
    AND product_id = p_product_id
    AND (variant_id = p_variant_id OR (p_variant_id IS NULL AND variant_id IS NULL));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_inventory(
  p_store_id UUID,
  p_product_id UUID,
  p_variant_id UUID,
  p_quantity INT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO store_inventory (store_id, product_id, variant_id, quantity)
  VALUES (p_store_id, p_product_id, p_variant_id, p_quantity)
  ON CONFLICT (store_id, product_id, variant_id) DO UPDATE
  SET quantity = store_inventory.quantity + p_quantity,
      updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. AUDIT LOGS & RPC
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_name TEXT,
  user_role TEXT,
  source TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  store_id UUID,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION log_pos_action(
  p_user_id UUID,
  p_user_name TEXT,
  p_user_role TEXT,
  p_action TEXT,
  p_target_type TEXT,
  p_target_id TEXT,
  p_details JSONB,
  p_store_id UUID
) RETURNS VOID AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id, user_name, user_role, source, action, target_type, target_id, details, store_id
  ) VALUES (
    p_user_id, p_user_name, p_user_role, 'pos', p_action, p_target_type, p_target_id, p_details, p_store_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. ENSURE POS SYNC POLICIES ALLOW FULL BIDIRECTIONAL SYNC (Orders, Refunds, Shifts, Customers)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pos_orders' AND policyname = 'POS full access pos_orders') THEN
    CREATE POLICY "POS full access pos_orders" ON pos_orders FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pos_order_items' AND policyname = 'POS full access pos_order_items') THEN
    CREATE POLICY "POS full access pos_order_items" ON pos_order_items FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pos_payments' AND policyname = 'POS full access pos_payments') THEN
    CREATE POLICY "POS full access pos_payments" ON pos_payments FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shifts' AND policyname = 'POS full access shifts') THEN
    CREATE POLICY "POS full access shifts" ON shifts FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'POS full access customers') THEN
    CREATE POLICY "POS full access customers" ON customers FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'online_order_bridge' AND policyname = 'POS full access online_order_bridge') THEN
    CREATE POLICY "POS full access online_order_bridge" ON online_order_bridge FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pending_orders' AND policyname = 'POS full access pending_orders') THEN
    CREATE POLICY "POS full access pending_orders" ON pending_orders FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
