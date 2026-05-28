import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

async function dump() {
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

  const supabase = createClient(url, key);

  console.log('Fetching online_order_bridge records...');
  const { data: bridge, error: bErr } = await supabase.from('online_order_bridge').select('*');
  if (bErr) {
    console.error('Error fetching bridge:', bErr);
    return;
  }
  console.log(`Found ${bridge.length} records in online_order_bridge.`);
  console.log(JSON.stringify(bridge, null, 2));

  console.log('\nFetching pending_orders records...');
  const { data: pending, error: pErr } = await supabase.from('pending_orders').select('*');
  if (pErr) {
    console.error('Error fetching pending:', pErr);
    return;
  }
  console.log(`Found ${pending.length} records in pending_orders.`);
  console.log(JSON.stringify(pending, null, 2));
}

dump();
