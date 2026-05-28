import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

let url = '';
let key = '';
for (const line of envContent.split('\n')) {
  if (line.trim().startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.trim().startsWith('SUPABASE_SERVICE_ROLE_KEY=')) key = line.split('=')[1].trim();
}

const supabase = createClient(url, key);

async function testMetrics() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  console.log('Today local:', today.toString());
  console.log('Today ISO:', today.toISOString());

  // 1. Salesman orders query
  const { data: salesmanOrders, error: salesmanErr } = await supabase
    .from('salesman_orders')
    .select('id, subtotal, status, created_at')
    .gte('created_at', today.toISOString());

  console.log('\n--- SALESMAN ORDERS ---');
  if (salesmanErr) console.error('Error:', salesmanErr);
  else {
    console.log('Count returned:', salesmanOrders?.length);
    console.log('Orders:', salesmanOrders);
  }

  // 2. POS completed orders query
  const { data: posOrders, error: posErr } = await supabase
    .from('pos_orders')
    .select('id, total, source, status, created_at')
    .eq('status', 'completed')
    .gte('created_at', today.toISOString());

  console.log('\n--- POS COMPLETED ORDERS ---');
  if (posErr) console.error('Error:', posErr);
  else {
    console.log('Count returned:', posOrders?.length);
    console.log('Orders:', posOrders);
  }

  // 3. Open shifts query
  const { data: openShifts, error: shiftErr } = await supabase
    .from('shifts')
    .select('id, employee_id, store_id, employees!inner(role)')
    .eq('status', 'open');

  console.log('\n--- OPEN SHIFTS ---');
  if (shiftErr) console.error('Error:', shiftErr);
  else {
    console.log('Count returned:', openShifts?.length);
    console.log('Shifts:', openShifts);
  }
}

testMetrics();
