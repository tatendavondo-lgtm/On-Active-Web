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

async function checkColumns() {
  const tables = ['pos_orders', 'pos_order_items', 'pos_payments', 'salesman_orders'];
  for (const table of tables) {
    const { data, error } = await supabase.rpc('exec_sql', {
       sql: `SELECT column_name FROM information_schema.columns WHERE table_name = '${table}'`
    });
    // Wait, exec_sql might not exist. Let's just create it and run it
  }
}

checkColumns();
