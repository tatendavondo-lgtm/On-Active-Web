-- Add needs_bridge flag to pending_orders to handle bridge failures gracefully
ALTER TABLE pending_orders
ADD COLUMN IF NOT EXISTS needs_bridge BOOLEAN DEFAULT false;
