import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

let url = '';
let key = '';
for (const line of envContent.split('\n')) {
  if (line.trim().startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.trim().startsWith('SUPABASE_SERVICE_ROLE_KEY=')) key = line.split('=')[1].trim();
}

const supabase = createClient(url, key);

async function inspect() {
  const { data: orders, error } = await supabase
    .from('pos_orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  console.log("Recent POS Orders:", orders);
  if (error) console.error("Error:", error);
}

inspect();
