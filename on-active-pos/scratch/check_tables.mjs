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

async function checkSalesmanOrders() {
  const { data, error } = await supabase.from('salesman_orders').select('*').limit(1);
  console.log('=== SALESMAN_ORDERS TABLE ===');
  if (error) {
    console.log('Error:', error.message);
  } else {
    if (data?.[0]) console.log('Columns:', Object.keys(data[0]));
    console.log('Sample:', JSON.stringify(data, null, 2));
  }

  // Also check pos_shifts
  const { data: shifts, error: sErr } = await supabase.from('pos_shifts').select('*').limit(1);
  console.log('\n=== POS_SHIFTS TABLE ===');
  if (sErr) {
    console.log('Error:', sErr.message);
  } else {
    if (shifts?.[0]) console.log('Columns:', Object.keys(shifts[0]));
    console.log('Sample:', JSON.stringify(shifts, null, 2));
  }
}

checkSalesmanOrders();
