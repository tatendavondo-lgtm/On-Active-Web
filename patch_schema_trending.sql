-- Add gender and is_trending columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'All',
ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT false;

-- If you have a pos_products view or similar that needs updating, ensure it's refreshed or updated if it explicitly selects columns.
