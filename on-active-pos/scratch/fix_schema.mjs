import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envPath = 'c:/Users/taten/Desktop/On Active Web/.env.local';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function addMissingColumns() {
  console.log('Adding missing columns to salesman_orders...');

  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      ALTER TABLE salesman_orders
        ADD COLUMN IF NOT EXISTS customer_name text,
        ADD COLUMN IF NOT EXISTS items jsonb DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS subtotal numeric(10,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS item_count integer DEFAULT 0,
        ADD COLUMN IF NOT EXISTS notes text;
    `
  });

  if (error) {
    console.log('RPC approach failed, trying direct:', error.message);
    // If RPC doesn't work, we'll need to run this in the Supabase SQL editor
    console.log('\n=== RUN THIS SQL IN SUPABASE SQL EDITOR ===\n');
    console.log(`ALTER TABLE salesman_orders
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS items jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS subtotal numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS item_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes text;`);
    console.log('\n===========================================\n');
  } else {
    console.log('Columns added successfully!');
  }

  // Verify by trying to insert a test row with all fields
  const testId = '00000000-0000-0000-0000-000000000099';
  const { error: insertErr } = await supabase.from('salesman_orders').insert({
    id: testId,
    store_id: '00000000-0000-0000-0000-000000000001',
    salesman_id: '8f9a59bb-a4bd-488a-9dd8-217417c689c2',
    salesman_name: 'TEST',
    customer_name: 'Test Customer',
    items: [{ product_name: 'Test', quantity: 1, unit_price: 4.00 }],
    subtotal: 4.00,
    item_count: 1,
    notes: 'test note',
    status: 'pending',
  });

  if (insertErr) {
    console.log('Verification insert FAILED:', insertErr.message);
  } else {
    console.log('Verification insert SUCCESS — all columns work!');
    await supabase.from('salesman_orders').delete().eq('id', testId);
    console.log('Test row cleaned up');
  }
}

addMissingColumns();
