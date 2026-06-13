-- 1. CREATE ATOMIC INVENTORY INCREMENT RPCS (FOR REFUNDS)

-- Drop existing function if parameter names changed
DROP FUNCTION IF EXISTS increment_inventory(uuid, uuid, uuid, integer);

-- For store-specific inventory (branch level)
CREATE OR REPLACE FUNCTION increment_inventory(
  p_store_id UUID,
  p_product_id UUID,
  p_variant_id UUID,
  p_quantity INT
) RETURNS VOID AS $$
BEGIN
  -- Insert quantity directly if it doesn't exist
  INSERT INTO store_inventory (store_id, product_id, variant_id, quantity)
  VALUES (p_store_id, p_product_id, p_variant_id, p_quantity)
  ON CONFLICT (store_id, product_id, variant_id) DO UPDATE
  SET quantity = store_inventory.quantity + p_quantity,
      updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- For global products catalog inventory
CREATE OR REPLACE FUNCTION increment_global_inventory(
  p_product_id UUID,
  p_quantity INT
) RETURNS VOID AS $$
BEGIN
  -- Atomically increment the global stock
  UPDATE products
  SET stock_quantity = COALESCE(stock_quantity, 0) + p_quantity,
      updated_at = now()
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;

-- 2. ALTER pos_order_items TO SUPPORT REFUNDS
ALTER TABLE pos_order_items ADD COLUMN IF NOT EXISTS refunded_quantity INT DEFAULT 0;
