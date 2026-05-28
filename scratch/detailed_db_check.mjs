import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

let url = '', key = '';
for (const line of envContent.split('\n')) {
  if (line.trim().startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=').slice(1).join('=').trim();
  if (line.trim().startsWith('SUPABASE_SERVICE_ROLE_KEY=')) key = line.split('=').slice(1).join('=').trim();
}
const supabase = createClient(url, key);

console.log('Connected to:', url);
console.log('');

// 1. Check settings table with detailed error
console.log('=== SETTINGS TABLE ===');
const { data: settings, error: settingsErr, count } = await supabase
  .from('settings')
  .select('*', { count: 'exact' });
if (settingsErr) {
  console.log('❌ Error accessing settings:', settingsErr.message, settingsErr.details, settingsErr.hint);
} else {
  console.log('✅ Settings rows:', count);
  console.log('Data:', settings);
}

// 2. Check salesman_orders more thoroughly  
console.log('\n=== SALESMAN_ORDERS FULL CHECK ===');
const { data: so, error: soErr } = await supabase
  .from('salesman_orders')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(5);
if (soErr) console.log('❌ Error:', soErr.message);
else console.log(`✅ Row count: ${so?.length}. Sample:`, so?.[0] || 'EMPTY');

// 3. Check store_inventory detail
console.log('\n=== STORE INVENTORY DETAIL ===');
const { data: inv, error: invErr } = await supabase
  .from('store_inventory')
  .select('*, product:products(name)');
if (invErr) console.log('❌ Error:', invErr.message);
else { console.log('Inventory rows:', inv?.length); inv?.forEach(i => console.log(` - ${i.product?.name}: qty ${i.quantity}`)); }

// 4. Check employees table structure for shifts join
console.log('\n=== EMPLOYEES TABLE ===');
const { data: emps, error: empsErr } = await supabase
  .from('employees')
  .select('id, full_name, role, store_id, is_active');
if (empsErr) console.log('❌ Error:', empsErr.message);
else {
  console.log('Count:', emps?.length);
  emps?.forEach(e => console.log(` - ${e.full_name} [${e.role}] active:${e.is_active}`));
}

// 5. Check pos_orders full detail
console.log('\n=== POS ORDERS DETAIL ===');
const { data: pos, error: posErr } = await supabase
  .from('pos_orders')
  .select('id, order_number, status, total, source, created_at, store_id')
  .order('created_at', { ascending: false });
if (posErr) console.log('❌ Error:', posErr.message);
else {
  console.log('Total pos_orders:', pos?.length);
  pos?.forEach(o => console.log(` - [${o.status}] ${o.order_number} $${o.total} ${o.created_at?.slice(0,10)}`));
}

// 6. Check pending_orders detail
console.log('\n=== PENDING_ORDERS (ONLINE) DETAIL ===');
const { data: po, error: poErr } = await supabase
  .from('pending_orders')
  .select('id, order_ref, status, total_usd, created_at')
  .order('created_at', { ascending: false });
if (poErr) console.log('❌ Error:', poErr.message);
else {
  console.log('Total pending_orders:', po?.length);
  po?.forEach(o => console.log(` - [${o.status}] ${o.order_ref} $${o.total_usd} ${o.created_at?.slice(0,10)}`));
}

// 7. Check products
console.log('\n=== PRODUCTS ===');
const { data: prods, error: prodsErr } = await supabase
  .from('products')
  .select('id, name, is_active, price_usd');
if (prodsErr) console.log('❌ Error:', prodsErr.message);
else {
  console.log('Total products:', prods?.length);
  prods?.forEach(p => console.log(` - [${p.is_active ? 'ACTIVE' : 'inactive'}] ${p.name} $${p.price_usd}`));
}
