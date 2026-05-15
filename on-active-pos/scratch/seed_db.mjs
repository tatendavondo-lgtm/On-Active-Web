import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env manually
const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function setupTestData() {
  console.log('Fetching/Creating Store...');
  let storeId = '00000000-0000-0000-0000-000000000001';
  
  const { data: stores } = await supabase.from('stores').select('id').limit(1);
  if (stores && stores.length > 0) {
    storeId = stores[0].id;
    console.log(`Using existing store: ${storeId}`);
  } else {
    console.log('Creating default store...');
    const { data: newStore, error } = await supabase.from('stores').insert({
      id: storeId,
      name: 'On Active — Harare CBD',
      code: 'HRE',
      is_active: true
    }).select().single();
    if (error) console.error('Store creation failed:', error.message);
  }

  console.log('Adding test employees...');
  const testEmployees = [
    {
      id: crypto.randomUUID(),
      store_id: storeId,
      full_name: 'John Moyo (Test Sales)',
      role: 'salesman',
      pin: '1234',
      is_active: true
    },
    {
      id: crypto.randomUUID(),
      store_id: storeId,
      full_name: 'Sarah N. (Test Till)',
      role: 'till_operator',
      pin: '5678',
      is_active: true
    }
  ];

  for (const emp of testEmployees) {
    const { error } = await supabase.from('employees').upsert(emp, { onConflict: 'pin' });
    if (error) {
      console.log(`❌ Failed to add ${emp.full_name}: ${error.message}`);
    } else {
      console.log(`✅ Added ${emp.full_name} (PIN: ${emp.pin})`);
    }
  }
}

setupTestData();
