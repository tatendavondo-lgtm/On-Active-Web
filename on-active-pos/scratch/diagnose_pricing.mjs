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

async function diagnosePricing() {
  console.log('--- PRICING DIAGNOSTIC ---');
  
  const { data: products, error: pErr } = await supabase.from('products').select('id, name, price_usd').limit(5);
  console.log('Products sample:', products);

  const { data: variants, error: vErr } = await supabase.from('product_variants').select('*').limit(5);
  console.log('Variants sample:', variants);

  if (pErr || vErr) console.error('Errors:', pErr?.message, vErr?.message);
}

diagnosePricing();
