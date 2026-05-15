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
    const { data } = await supabase.from(table).select('*').limit(1);
    console.log(`\n=== ${table} ===`);
    // since some tables might be empty, we might not get columns this way.
    // Let's use RPC if possible or a trick to get an error message with columns.
    // Instead we can just do a select without returning rows to see if we can get schema info.
    // Postgrest returns columns in the first row if there is data.
    
    // An alternative way to get columns is to use the supabase openapi endpoint:
    try {
        const response = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${table}?limit=1`, {
            headers: {
                'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
            }
        });
        const json = await response.json();
        console.log("Data length:", json.length);
        if (json.length > 0) {
            console.log("Columns:", Object.keys(json[0]));
        } else {
             console.log("Table is empty, trying to fetch just one fake row to see error...");
             const res = await supabase.from(table).insert({ id: '00000000-0000-0000-0000-000000000099' }).select();
             if (res.error) console.log("Insert error:", res.error.message);
        }
    } catch(e) {}
  }
}

checkColumns();
