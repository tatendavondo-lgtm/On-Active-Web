import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hnyilsmevqenwpspuguz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhueWlsc21ldnFlbndwc3B1Z3V6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDk4MTg1MiwiZXhwIjoyMDkwNTU3ODUyfQ.1a0VP9pNtBlAP2kNLaGEIwU4LHSoeIIhrzmdSuahaxs';
const supabase = createClient(supabaseUrl, supabaseKey);

async function simulateFlow() {
  console.log('=== SIMULATION: Webstore to POS Flow ===\n');

  // 1. Simulate Webstore Checkout
  console.log('Step 1: Simulating Webstore Checkout...');
  const orderRef = `TEST-${Math.floor(Math.random() * 10000)}`;
  const { data: webOrder, error: webErr } = await supabase.from('pending_orders').insert({
    order_ref: orderRef,
    total_usd: 150.00,
    items: [
      { productId: 'test-p1', name: 'Test Shirt', quantity: 2, price_usd: 75.00 }
    ],
    status: 'pending'
  }).select().single();

  if (webErr) {
    console.error('FAIL: Checkout failed -', webErr.message);
    return;
  }
  console.log(`SUCCESS: Created web order ${webOrder.id} (${orderRef})`);

  // 2. Simulate Bridge Assignment
  console.log('\nStep 2: Simulating Bridge Assignment...');
  const { data: store } = await supabase.from('stores').select('id').limit(1).single();
  
  const { data: bridgeOrder, error: bridgeErr } = await supabase.from('online_order_bridge').insert({
    webstore_order_id: webOrder.id,
    store_id: store.id,
    fulfillment: 'collection',
    status: 'pending',
    customer_name: 'Test Customer',
    total: 150.00
  }).select().single();

  if (bridgeErr) {
    console.error('FAIL: Bridge creation failed -', bridgeErr.message);
  } else {
    console.log(`SUCCESS: Bridge record created with ID ${bridgeOrder.id}`);
  }

  // 3. Verify Admin Hub see it
  console.log('\nStep 3: Verifying Admin Hub visibility...');
  const { data: adminMetrics } = await supabase.from('online_order_bridge').select('id, status').eq('status', 'pending');
  console.log(`Admin Hub sees ${adminMetrics?.length} pending online orders.`);

  // 4. Cleanup
  console.log('\nStep 4: Cleanup...');
  await supabase.from('online_order_bridge').delete().eq('id', bridgeOrder.id);
  await supabase.from('pending_orders').delete().eq('id', webOrder.id);
  console.log('Done.');
}

simulateFlow();
