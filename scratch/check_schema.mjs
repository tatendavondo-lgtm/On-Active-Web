import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envContent = fs.readFileSync(path.join(__dirname, '../on-active-pos/.env'), 'utf-8');
const envLines = envContent.split('\n');
let supabaseUrl = '';
let supabaseKey = '';

for (const line of envLines) {
  if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const orderCols = ['tax_amount', 'device_id', 'currency', 'total_discount', 'customer_id'];
  for (const col of orderCols) {
    const { error } = await supabase.from('pos_orders').select(col).limit(1);
    if (error) {
      console.log(`pos_orders '${col}' missing:`, error.message);
    } else {
      console.log(`pos_orders '${col}' EXISTS.`);
    }
  }

  const itemCols = ['sku', 'discount_amount'];
  for (const col of itemCols) {
    const { error } = await supabase.from('pos_order_items').select(col).limit(1);
    if (error) {
      console.log(`pos_order_items '${col}' missing:`, error.message);
    } else {
      console.log(`pos_order_items '${col}' EXISTS.`);
    }
  }
}
check();
