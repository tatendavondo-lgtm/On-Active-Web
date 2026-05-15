import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read keys from .env.local (the "brain" of the project)
const envPath = path.join('c:/Users/taten/Desktop/On Active Web', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL, 
  env.SUPABASE_SERVICE_ROLE_KEY // Using the powerful key
);

async function runAudit() {
  const tables = [
    'products', 'product_variants', 'stores', 'employees', 
    'store_inventory', 'pos_shifts', 'pos_orders', 'pos_payments',
    'salesman_orders', 'online_order_bridge', 'exchange_rates'
  ];

  console.log('--- DATABASE SCHEMA AUDIT ---');
  for (const table of tables) {
    const { error } = await supabase.from(table).select('*').limit(0);
    if (error) {
      if (error.code === 'PGRST116' || error.code === '42P01') {
        console.log(`❌ MISSING: ${table}`);
      } else {
        console.log(`⚠️  UNKNOWN ERROR on ${table}: ${error.message} (${error.code})`);
      }
    } else {
      console.log(`✅ ALREADY EXISTS: ${table}`);
    }
  }
}

runAudit();
