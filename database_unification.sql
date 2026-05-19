-- ON ACTIVE ECOSYSTEM DATABASE UNIFICATION
-- Run this script in your Supabase SQL Editor to unify the data layer.

-- ============================================================================
-- FIX 1: STAFF TABLE RECONCILIATION (SCENARIO A)
-- The admin hub staff page already writes to 'employees'.
-- We need to ensure the 'employees' table has all the required POS columns.
-- Using IF NOT EXISTS makes it safe to run multiple times.
-- ============================================================================

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS pin_hash TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- Verify RLS for employees table to allow admin operations.
-- We assume service_role and owner/manager roles should be able to read and write.
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'employees' AND policyname = 'Admin and Managers can manage employees'
  ) THEN
    CREATE POLICY "Admin and Managers can manage employees"
    ON employees FOR ALL
    USING (
      auth.role() = 'service_role' OR 
      auth.jwt() ->> 'role' IN ('owner', 'manager', 'admin')
    );
  END IF;
END $$;


-- ============================================================================
-- FIX 2: CREATE ONLINE ORDER BRIDGE
-- The webstore checkout now writes to 'online_order_bridge'. We must create it.
-- ============================================================================

CREATE TABLE IF NOT EXISTS online_order_bridge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webstore_order_id UUID NOT NULL,
  pos_order_id UUID, -- References pos_orders(id) once pos_orders is fully confirmed
  store_id UUID,     -- References stores(id) once stores is fully confirmed
  fulfillment TEXT NOT NULL CHECK (fulfillment IN ('collection', 'delivery')),
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'preparing', 'ready',
    'collected', 'out_for_delivery', 'delivered', 'completed', 'cancelled'
  )),
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  items JSONB,
  total NUMERIC(10,2),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  ready_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE(webstore_order_id)
);

-- Safely create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_bridge_store ON online_order_bridge(store_id);
CREATE INDEX IF NOT EXISTS idx_bridge_status ON online_order_bridge(status);

-- Enable RLS and setup policies
ALTER TABLE online_order_bridge ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'online_order_bridge' AND policyname = 'Store staff can see their store bridge orders'
  ) THEN
    CREATE POLICY "Store staff can see their store bridge orders"
    ON online_order_bridge FOR ALL
    USING (
      auth.role() = 'service_role' OR
      store_id IN (
        SELECT store_id FROM employees WHERE id = auth.uid()
      )
    );
  END IF;
END $$;


-- ============================================================================
-- FIX 3: POS ORDERS ACCESSIBILITY
-- Ensure the Admin Hub can read POS data for its dashboards.
-- ============================================================================

DO $$ 
BEGIN
  -- pos_orders policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'pos_orders' AND policyname = 'Admin hub can read all pos_orders'
  ) THEN
    CREATE POLICY "Admin hub can read all pos_orders"
    ON pos_orders FOR SELECT
    USING (
      auth.jwt() ->> 'role' IN ('owner', 'manager', 'admin')
      OR auth.role() = 'service_role'
    );
  END IF;
  
  -- pos_order_items policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'pos_order_items' AND policyname = 'Admin hub can read pos_order_items'
  ) THEN
    CREATE POLICY "Admin hub can read pos_order_items"
    ON pos_order_items FOR SELECT
    USING (
      auth.role() = 'service_role' OR
      EXISTS (
        SELECT 1 FROM pos_orders o WHERE o.id = pos_order_items.order_id
      )
    );
  END IF;
  
  -- pos_payments policy
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'pos_payments'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'pos_payments' AND policyname = 'Admin hub can read pos_payments'
    ) THEN
      CREATE POLICY "Admin hub can read pos_payments"
      ON pos_payments FOR SELECT
      USING (
        auth.role() = 'service_role' OR
        EXISTS (
          SELECT 1 FROM pos_orders o WHERE o.id = pos_payments.order_id
        )
      );
    END IF;
  END IF;
END $$;


-- ============================================================================
-- FIX 4: ENABLE REALTIME
-- Enable realtime on tables that need cross-app sync.
-- ============================================================================

-- A safe helper function to enable realtime on a table without duplicate errors
CREATE OR REPLACE FUNCTION enable_realtime_for_table(target_table_name text)
RETURNS void AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = target_table_name) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = target_table_name
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', target_table_name);
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
SELECT enable_realtime_for_table('pos_orders');
SELECT enable_realtime_for_table('pos_order_items');
SELECT enable_realtime_for_table('salesman_orders');
SELECT enable_realtime_for_table('store_inventory');
SELECT enable_realtime_for_table('online_order_bridge');
SELECT enable_realtime_for_table('exchange_rates');

-- Drop helper function
DROP FUNCTION enable_realtime_for_table(text);
