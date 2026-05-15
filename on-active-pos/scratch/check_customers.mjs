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

async function checkCustomersTable() {
    const { data, error } = await supabase.from('customers').select('*').limit(1);
    if (error) {
        console.log("Error fetching customers:", error.message);
    } else {
        console.log("Customers data found:", data);
    }
}

checkCustomersTable();
