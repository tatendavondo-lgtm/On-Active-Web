import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

async function testAIPageQueries() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  let url = '';
  let serviceKey = '';
  
  envContent.split('\n').forEach(line => {
    if (line.trim().startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      url = line.split('=')[1].trim().replace(/^"(.*)"$/, '$1');
    }
    if (line.trim().startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
      serviceKey = line.split('=')[1].trim().replace(/^"(.*)"$/, '$1');
    }
  });

  const supabase = createClient(url, serviceKey);

  console.log('Testing pos_orders 30d fetch...');
  const ago30 = new Date(Date.now() - 30 * 86400000).toISOString();
  const { data: posOrders30d, error: posError } = await supabase
    .from('pos_orders')
    .select('id, total')
    .gte('created_at', ago30)
    .neq('status', 'cancelled');

  if (posError) {
    console.error('posOrders30d error:', posError);
    return;
  }

  console.log(`Found ${posOrders30d?.length ?? 0} POS orders.`);
  
  const orderIds = (posOrders30d ?? []).map(o => o.id).filter(Boolean);
  console.log('Order IDs for IN query:', orderIds);

  const { data: posItems30d, error: itemsError } = await supabase
    .from('pos_order_items')
    .select('product_id, product_name, quantity')
    .in('order_id', orderIds);

  if (itemsError) {
    console.error('posItems30d error:', itemsError);
  } else {
    console.log(`Successfully fetched ${posItems30d?.length ?? 0} order items.`);
  }
}

testAIPageQueries();
