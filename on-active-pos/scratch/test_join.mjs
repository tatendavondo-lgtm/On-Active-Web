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

async function testJoin() {
  const { data, error } = await supabase
    .from('products')
    .select('*, product_variants(*)')
    .limit(1);

  console.log('Join Result:', JSON.stringify(data, null, 2));
  if (error) console.error('Join Error:', error);
}

testJoin();
