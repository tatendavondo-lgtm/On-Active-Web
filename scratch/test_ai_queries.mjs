import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

async function testQueries() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  let url = '';
  let key = '';
  
  envContent.split('\n').forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      url = line.split('=')[1].trim().replace(/^"(.*)"$/, '$1');
    }
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
      key = line.split('=')[1].trim().replace(/^"(.*)"$/, '$1');
    }
  });

  console.log('URL exists:', !!url);
  console.log('Service Role Key exists:', !!key);

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  console.log('Fetching pos_orders...');
  const posOrders = await supabase
    .from('pos_orders')
    .select('id, order_number, source, total, status, created_at, auto_discount_applied, auto_discount_amount')
    .eq('status', 'completed')
    .gte('created_at', todayStart.toISOString());
  
  if (posOrders.error) console.error('pos_orders error:', posOrders.error);
  else console.log('pos_orders success:', posOrders.data?.length);

  console.log('Fetching shifts...');
  const openShifts = await supabase
    .from('shifts')
    .select('id, employee_id, store_id, opened_at, opening_cash')
    .eq('status', 'open');

  if (openShifts.error) console.error('shifts error:', openShifts.error);
  else console.log('shifts success:', openShifts.data?.length);

  console.log('Fetching online_order_bridge...');
  const pendingOnline = await supabase
    .from('online_order_bridge')
    .select('id, fulfillment, status, total, customer_name, assigned_at')
    .not('status', 'in', '("completed","cancelled")');

  if (pendingOnline.error) console.error('online_order_bridge error:', pendingOnline.error);
  else console.log('online_order_bridge success:', pendingOnline.data?.length);
}

testQueries();
