import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hnyilsmevqenwpspuguz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhueWlsc21ldnFlbndwc3B1Z3V6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDk4MTg1MiwiZXhwIjoyMDkwNTU3ODUyfQ.1a0VP9pNtBlAP2kNLaGEIwU4LHSoeIIhrzmdSuahaxs';
const supabase = createClient(supabaseUrl, supabaseKey);

async function audit() {
  console.log('--- DATABASE AUDIT ---');
  
  const tables = [
    'employees', 'stores', 'shifts', 'salesman_orders', 'pos_orders', 
    'pos_order_items', 'pos_payments', 'customers', 'online_order_bridge',
    'store_inventory', 'products', 'pending_orders'
  ];

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`[${table}]: ERROR - ${error.message}`);
    } else {
      const cols = data.length > 0 ? Object.keys(data[0]) : 'Empty (checking via empty select)';
      if (data.length === 0) {
          const { error: colErr } = await supabase.from(table).select('*').limit(0);
          // Note: Object.keys won't work on empty data, but we can see if the select * works
          console.log(`[${table}]: OK - Table exists`);
      } else {
          console.log(`[${table}]: OK - Columns: ${cols.join(', ')}`);
      }
    }
  }
}

audit();
