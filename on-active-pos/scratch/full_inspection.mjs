import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.join('c:/Users/taten/Desktop/On Active Web', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function fullInspection() {
  // 1. Products - sample row
  const { data: sampleProduct } = await supabase.from('products').select('*').limit(1);
  console.log('=== PRODUCTS TABLE ===');
  if (sampleProduct?.[0]) {
    console.log('Columns:', Object.keys(sampleProduct[0]));
    console.log('Sample:', JSON.stringify(sampleProduct[0], null, 2));
  }

  // 2. Product variants
  const { data: sampleVariants, error: vErr } = await supabase.from('product_variants').select('*').limit(3);
  console.log('\n=== PRODUCT_VARIANTS TABLE ===');
  if (vErr) {
    console.log('Error:', vErr.message);
  } else {
    if (sampleVariants?.[0]) console.log('Columns:', Object.keys(sampleVariants[0]));
    console.log('Sample:', JSON.stringify(sampleVariants, null, 2));
  }

  // 3. Full join
  const { data: joined } = await supabase
    .from('products')
    .select('id, name, price_usd, stock_quantity, sizes, category, images, product_variants(id, name, sku, price, product_id)')
    .limit(3);
  console.log('\n=== JOINED DATA ===');
  console.log(JSON.stringify(joined, null, 2));

  // 4. Exchange rates
  const { data: rates, error: rErr } = await supabase.from('exchange_rates').select('*');
  console.log('\n=== EXCHANGE_RATES ===');
  if (rErr) console.log('Error:', rErr.message);
  else console.log(JSON.stringify(rates, null, 2));

  // 5. Store inventory
  const { data: invSample, error: iErr } = await supabase.from('store_inventory').select('*').limit(3);
  console.log('\n=== STORE_INVENTORY ===');
  if (iErr) console.log('Error:', iErr.message);
  else {
    if (invSample?.[0]) console.log('Columns:', Object.keys(invSample[0]));
    console.log('Sample:', JSON.stringify(invSample, null, 2));
  }

  // 6. Stores
  const { data: stores } = await supabase.from('stores').select('*');
  console.log('\n=== STORES ===');
  console.log(JSON.stringify(stores, null, 2));

  // 7. Employees
  const { data: emps } = await supabase.from('employees').select('*');
  console.log('\n=== EMPLOYEES ===');
  console.log(JSON.stringify(emps, null, 2));
}

fullInspection();
