import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envPath = 'c:/Users/taten/Desktop/On Active Web/.env.local';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkStockMismatch() {
    const { data: p } = await supabase.from('products').select('id, name, stock_quantity');
    const { data: si } = await supabase.from('store_inventory').select('*');
    const { data: pv } = await supabase.from('product_variants').select('*');
    
    console.log("Products Stock:", p);
    console.log("Store Inventory:", si);
    console.log("Product Variants:", pv);
}

checkStockMismatch();
