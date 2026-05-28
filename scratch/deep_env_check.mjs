import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load BOTH possible env files and compare
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

let adminUrl = '', adminKey = '', anonKey = '';
for (const line of envContent.split('\n')) {
  if (line.trim().startsWith('NEXT_PUBLIC_SUPABASE_URL=')) adminUrl = line.split('=').slice(1).join('=').trim();
  if (line.trim().startsWith('SUPABASE_SERVICE_ROLE_KEY=')) adminKey = line.split('=').slice(1).join('=').trim();
  if (line.trim().startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) anonKey = line.split('=').slice(1).join('=').trim();
}

// Also check POS env if it exists
let posUrl = '', posKey = '';
const posEnvPath = path.join(process.cwd(), 'on-active-pos', '.env.local');
if (fs.existsSync(posEnvPath)) {
  const posEnv = fs.readFileSync(posEnvPath, 'utf8');
  for (const line of posEnv.split('\n')) {
    if (line.trim().startsWith('VITE_SUPABASE_URL=')) posUrl = line.split('=').slice(1).join('=').trim();
    if (line.trim().startsWith('VITE_SUPABASE_SERVICE_ROLE_KEY=')) posKey = line.split('=').slice(1).join('=').trim();
    if (line.trim().startsWith('VITE_SUPABASE_ANON_KEY=')) posKey = posKey || line.split('=').slice(1).join('=').trim();
  }
}

console.log('\n=== ENV COMPARISON ===');
console.log('Admin Hub URL:    ', adminUrl);
console.log('POS URL:          ', posUrl);
console.log('URLs match?       ', adminUrl === posUrl || posUrl === '' ? (posUrl === '' ? '(POS env not found)' : '✅ YES') : '❌ DIFFERENT PROJECTS!');

const supabase = createClient(adminUrl, adminKey);

console.log('\n=== CHECKING salesman_orders WITH ADMIN HUB CREDENTIALS ===');
const { data: orders, error } = await supabase
  .from('salesman_orders')
  .select('id, status, subtotal, created_at, store_id')
  .order('created_at', { ascending: false })
  .limit(5);

if (error) {
  console.log('❌ Error:', error.message);
} else {
  console.log(`Found ${orders?.length ?? 0} records`);
  orders?.forEach(o => console.log(` - [${o.status}] $${o.subtotal} at ${o.created_at?.slice(0,10)} store:${o.store_id?.slice(0,8)}`));
}

console.log('\n=== CHECKING ALL TABLES EXIST ===');
const tables = ['salesman_orders', 'pos_orders', 'pending_orders', 'profiles', 'employees', 'shifts', 'stores', 'store_inventory', 'products', 'online_order_bridge', 'settings'];
for (const t of tables) {
  const { count, error: te } = await supabase.from(t).select('id', { count: 'exact', head: true });
  if (te) console.log(`  ❌ ${t}: ${te.message}`);
  else console.log(`  ✅ ${t}: ${count} rows`);
}
