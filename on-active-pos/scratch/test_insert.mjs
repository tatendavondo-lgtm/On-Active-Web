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

async function checkSchema() {
  // Use a raw SQL query via RPC to get column info
  // Since we can't do that easily, let's try an insert with all fields and see what errors
  const testId = '00000000-0000-0000-0000-000000000099';
  
  const { error } = await supabase.from('salesman_orders').insert({
    id: testId,
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
  });

  if (error) {
    console.log('Insert error:', error.message);
    console.log('Details:', error.details);
    console.log('Hint:', error.hint);
    console.log('Code:', error.code);
  } else {
    console.log('Insert SUCCESS — all columns valid');
    // Clean up
    await supabase.from('salesman_orders').delete().eq('id', testId);
    console.log('Cleaned up test row');
  }
}

checkSchema();
