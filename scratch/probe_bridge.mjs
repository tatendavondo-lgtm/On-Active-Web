import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

async function probe() {
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

  const possibleColumns = [
    'id', 'store_id', 'fulfillment', 'status', 'created_at', 'updated_at', 
    'webstore_order_id', 'pos_order_id', 'customer_name', 'customer_phone', 
    'customer_email', 'items', 'total', 'total_usd', 'assigned_at', 'accepted_at', 
    'ready_at', 'completed_at', 'order_id', 'order_ref', 'order_number'
  ];

  console.log('Probing columns for online_order_bridge...');
  for (const col of possibleColumns) {
    const { error } = await supabase.from('online_order_bridge').select(col).limit(0);
    if (!error) {
      console.log(`  [EXISTING] ${col}`);
    } else {
      console.log(`  [MISSING ] ${col} (${error.message})`);
    }
  }
}

probe();
