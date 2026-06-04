-- WIPE DATABASE SCRIPT (INCLUDING ALL ACCOUNTS)
-- WARNING: This will permanently delete all operational data AND all user accounts.
-- Do NOT run this if you want to keep any test orders or logins.

-- 1. Delete all users from Supabase Authentication (This logs everyone out permanently)
DELETE FROM auth.users;

-- 2. Clear all tables and reset auto-incrementing IDs
TRUNCATE TABLE 
  profiles,
  products, 
  product_variants, 
  store_inventory, 
  customers, 
  shifts,
  pending_orders, 
  online_order_bridge, 
  salesman_orders, 
  pos_orders, 
  pos_order_items, 
  pos_payments
RESTART IDENTITY CASCADE;

-- Note: We are deliberately NOT truncating the `stores` table 
-- so you don't lose your store branch configurations.
