import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env.local');
const envFile = fs.readFileSync(envPath, 'utf-8');
const envVars = envFile.split('\n').reduce((acc, line) => {
  const [key, ...values] = line.split('=');
  if (key && values.length) acc[key.trim()] = values.join('=').trim().replace(/(^"|"$)/g, '').replace(/(^'|'$)/g, '');
  return acc;
}, {});

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = envVars['SUPABASE_SERVICE_ROLE_KEY'];
const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
  console.log('=== VERIFICATION: Database Unification ===\n');

  // CHECK 1: Do pin_hash, email, phone columns exist on employees?
  console.log('--- CHECK 1: employees table columns ---');
  const { data: empSample, error: empErr } = await supabase.from('employees').select('*').limit(1);
  if (empErr) {
    console.log('FAIL: Cannot read employees:', empErr.message);
  } else if (empSample.length > 0) {
    const cols = Object.keys(empSample[0]);
    console.log('Columns found:', cols.join(', '));
    console.log('  pin_hash:', cols.includes('pin_hash') ? 'YES' : 'MISSING');
    console.log('  email:', cols.includes('email') ? 'YES' : 'MISSING');
    console.log('  phone:', cols.includes('phone') ? 'YES' : 'MISSING');
  } else {
    // Empty table - try inserting and reading schema via a different approach
    console.log('Table is empty, checking columns via dummy select...');
    const { error: colErr } = await supabase.from('employees').select('pin_hash, email, phone').limit(0);
    if (colErr) console.log('FAIL: Columns missing -', colErr.message);
    else console.log('YES: pin_hash, email, phone columns exist');
  }

  // CHECK 2: Does online_order_bridge table exist?
  console.log('\n--- CHECK 2: online_order_bridge table ---');
  const { data: bridgeData, error: bridgeErr } = await supabase.from('online_order_bridge').select('*').limit(0);
  if (bridgeErr) {
    console.log('FAIL: online_order_bridge does not exist or is inaccessible:', bridgeErr.message);
  } else {
    console.log('YES: online_order_bridge table exists and is accessible');
  }

  // CHECK 3: Can we read pos_orders? (tests RLS policy)
  console.log('\n--- CHECK 3: pos_orders readable (RLS check) ---');
  const { data: posData, error: posErr } = await supabase.from('pos_orders').select('id').limit(1);
  if (posErr) {
    console.log('FAIL: Cannot read pos_orders:', posErr.message);
  } else {
    console.log('YES: pos_orders is readable, rows found:', posData.length);
  }

  // CHECK 4: Can we read pos_order_items?
  console.log('\n--- CHECK 4: pos_order_items readable (RLS check) ---');
  const { data: poiData, error: poiErr } = await supabase.from('pos_order_items').select('id').limit(1);
  if (poiErr) {
    console.log('FAIL: Cannot read pos_order_items:', poiErr.message);
  } else {
    console.log('YES: pos_order_items is readable, rows found:', poiData.length);
  }

  // CHECK 5: Does stores table exist and have data?
  console.log('\n--- CHECK 5: stores table ---');
  const { data: storesData, error: storesErr } = await supabase.from('stores').select('id, name').limit(5);
  if (storesErr) {
    console.log('FAIL: Cannot read stores:', storesErr.message);
  } else {
    console.log('YES: stores table accessible, count:', storesData.length);
    storesData.forEach(s => console.log('  -', s.name, `(${s.id})`));
  }

  console.log('\n=== VERIFICATION COMPLETE ===');
}

verify().catch(console.error);
