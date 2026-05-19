import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

async function auditColumns() {
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

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  console.log('--- pos_orders columns ---');
  const { data: posData, error: posErr } = await supabase.from('pos_orders').select('*').limit(1);
  if (posErr) {
    console.error('pos_orders read error:', posErr);
  } else if (posData.length > 0) {
    console.log(Object.keys(posData[0]));
  } else {
    console.log('pos_orders is empty, trying dummy select to probe columns...');
    // We can list common column guesses
    const checkCols = ['id', 'order_number', 'source', 'status', 'total', 'created_at', 'auto_discount_applied', 'auto_discount_amount', 'discount_amount', 'discount'];
    for (const c of checkCols) {
      const { error } = await supabase.from('pos_orders').select(c).limit(0);
      console.log(`  ${c}:`, !error ? 'YES' : 'NO');
    }
  }

  console.log('\n--- online_order_bridge columns ---');
  const { data: bridgeData, error: bridgeErr } = await supabase.from('online_order_bridge').select('*').limit(1);
  if (bridgeErr) {
    console.error('online_order_bridge read error:', bridgeErr);
  } else if (bridgeData.length > 0) {
    console.log(Object.keys(bridgeData[0]));
  } else {
    console.log('online_order_bridge is empty, trying dummy select to probe columns...');
    const checkCols = ['id', 'webstore_order_id', 'pos_order_id', 'store_id', 'fulfillment', 'status', 'customer_name', 'total', 'total_usd'];
    for (const c of checkCols) {
      const { error } = await supabase.from('online_order_bridge').select(c).limit(0);
      console.log(`  ${c}:`, !error ? 'YES' : 'NO');
    }
  }
}

auditColumns();
