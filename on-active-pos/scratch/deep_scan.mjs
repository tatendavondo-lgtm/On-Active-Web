import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.join('c:/Users/taten/Desktop/On Active Web', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function deepScan() {
  console.log('--- SYSTEM SCHEMA SCAN ---');
  
  // Query the information_schema to see all public tables
  const { data, error } = await supabase.rpc('get_tables_info');
  
  // Fallback: If no RPC, try to list common table names
  if (error) {
     const { data: tables, error: tableError } = await supabase
       .from('pg_catalog.pg_tables')
       .select('tablename')
       .eq('schemaname', 'public');
     
     if (tableError) {
        console.log('Unable to query pg_tables. Trying manual discovery...');
        const commonNames = ['products', 'product', 'items', 'item', 'inventory', 'store_products'];
        for (const name of commonNames) {
          const { error: e } = await supabase.from(name).select('*').limit(0);
          if (!e) console.log(`✅ FOUND TABLE: ${name}`);
        }
     } else {
        tables.forEach(t => console.log(`✅ FOUND TABLE: ${t.tablename}`));
     }
  } else {
    console.log(data);
  }
}

deepScan();
