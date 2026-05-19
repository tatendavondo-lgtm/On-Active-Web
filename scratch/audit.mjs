import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env.local');
const envFile = fs.readFileSync(envPath, 'utf-8');
const envVars = envFile.split('\n').reduce((acc, line) => {
  const [key, ...values] = line.split('=');
  if (key && values.length) acc[key.trim()] = values.join('=').trim().replace(/(^"|"$)/g, '').replace(/(^'|'$)/g, '');
  return acc;
}, {});

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'] || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars['SUPABASE_SERVICE_ROLE_KEY'] || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runAudit() {
  console.log("=== STARTING AUDIT ===");

  // Helper to execute raw SQL via an RPC function, assuming we don't have a direct raw SQL endpoint.
  // Wait, if we don't have an RPC function for raw SQL, we can just use the standard Supabase client 
  // to query the information_schema or just fetch a single row from tables to inspect columns.

  // 1. Check if 'employees' and 'profiles' tables exist and fetch their structures
  const checkTable = async (tableName) => {
    const { data, error } = await supabase.from(tableName).select('*').limit(1);
    if (error) {
      console.log(`Table '${tableName}' error:`, error.message);
    } else {
      console.log(`Table '${tableName}' exists. First row or empty structure:`, data[0] ? Object.keys(data[0]) : "Empty table");
      if (data.length > 0) {
        console.log(`Sample row from ${tableName}:`, data[0]);
      }
    }
  }

  await checkTable('profiles');
  await checkTable('employees');
  await checkTable('orders');
  await checkTable('pos_orders');
  await checkTable('online_order_bridge');

  console.log("=== AUDIT COMPLETE ===");
}

runAudit();
