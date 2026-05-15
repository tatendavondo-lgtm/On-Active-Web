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

// Test each field individually
const fields = {
  id: '00000000-0000-0000-0000-000000000099',
  store_id: '00000000-0000-0000-0000-000000000001',
  salesman_id: '8f9a59bb-a4bd-488a-9dd8-217417c689c2',
  salesman_name: 'TEST',
  customer_name: 'TEST',
  items: [{ test: true }],
  subtotal: 10.00,
  item_count: 1,
  notes: 'test',
  status: 'pending',
  created_at: new Date().toISOString(),
  device_id: 'test',
  synced: false,
  accepted_at: null,
  completed_at: null,
};

async function probeColumns() {
  // Start with minimal required fields and add one at a time
  const base = {
    id: '00000000-0000-0000-0000-000000000099',
    store_id: '00000000-0000-0000-0000-000000000001',
    salesman_id: '8f9a59bb-a4bd-488a-9dd8-217417c689c2',
    status: 'pending',
  };

  // Try with just base
  let { error } = await supabase.from('salesman_orders').insert(base);
  if (error) {
    console.log('Base insert error:', error.message);
  } else {
    console.log('Base insert OK');
    await supabase.from('salesman_orders').delete().eq('id', base.id);
  }

  // Now try adding fields one by one
  const optionalFields = ['salesman_name', 'customer_name', 'items', 'subtotal', 'item_count', 'notes', 'created_at', 'device_id', 'synced', 'accepted_at', 'completed_at'];
  
  for (const field of optionalFields) {
    const testData = { ...base, [field]: fields[field] };
    const { error: e } = await supabase.from('salesman_orders').insert(testData);
    if (e) {
      console.log(`❌ '${field}' does NOT exist: ${e.message}`);
    } else {
      console.log(`✅ '${field}' exists`);
      await supabase.from('salesman_orders').delete().eq('id', base.id);
    }
  }
}

probeColumns();
