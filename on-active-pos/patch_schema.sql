-- 1. ADD MISSING COLUMNS TO AVOID DATA LOSS DURING SYNC
-- pos_orders missing columns
ALTER TABLE pos_orders ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE pos_orders ADD COLUMN IF NOT EXISTS device_id TEXT;
ALTER TABLE pos_orders ADD COLUMN IF NOT EXISTS customer_id UUID;

-- pos_order_items missing columns
ALTER TABLE pos_order_items ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE pos_order_items ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;

-- shifts missing columns
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS actual_cash DECIMAL(10,2);
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS device_id TEXT;


-- 2. CREATE BULLETPROOF ATOMIC INVENTORY DECREMENT RPCS
-- For store-specific inventory (branch level)
CREATE OR REPLACE FUNCTION decrement_inventory(
  p_store_id UUID,
  p_product_id UUID,
  p_variant_id UUID,
  p_quantity INT
) RETURNS VOID AS $$
BEGIN
  -- Insert 0 if it doesn't exist to prevent UPDATE from doing nothing
  INSERT INTO store_inventory (store_id, product_id, variant_id, quantity)
  VALUES (p_store_id, p_product_id, p_variant_id, 0)
  ON CONFLICT (store_id, product_id, variant_id) DO NOTHING;

  -- Atomically decrement, ensuring we don't go below 0
  UPDATE store_inventory
  SET quantity = GREATEST(0, quantity - p_quantity),
      last_updated = now()
  WHERE store_id = p_store_id
    AND product_id = p_product_id
    AND (variant_id = p_variant_id OR (p_variant_id IS NULL AND variant_id IS NULL));
END;
$$ LANGUAGE plpgsql;

-- For global products catalog inventory
CREATE OR REPLACE FUNCTION decrement_global_inventory(
  p_product_id UUID,
  p_quantity INT
) RETURNS VOID AS $$
BEGIN
  -- Atomically decrement the global stock, ensuring we don't go below 0
  UPDATE products
  SET stock_quantity = GREATEST(0, COALESCE(stock_quantity, 0) - p_quantity),
      updated_at = now()
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;
