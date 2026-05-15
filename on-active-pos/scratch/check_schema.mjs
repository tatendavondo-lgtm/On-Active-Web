import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkSchema() {
  const tables = [
    'stores', 'employees', 'products', 'product_variants', 
    'store_inventory', 'exchange_rates', 'pos_shifts', 
    'pos_orders', 'pos_order_items', 'pos_payments', 
    'salesman_orders', 'online_order_bridge'
  ];

  console.log('Checking tables...');
  for (const table of tables) {
    const { error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`❌ ${table}: ${error.message}`);
    } else {
      console.log(`✅ ${table}`);
    }
  }
}

checkSchema();
