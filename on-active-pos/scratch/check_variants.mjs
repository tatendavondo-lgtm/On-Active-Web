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

async function checkVariants() {
  const { data: products } = await supabase.from('products').select('id, name');
  const vest = products.find(p => p.name.toLowerCase().includes('vest'));
  
  if (vest) {
    console.log('Found Vest:', vest);
    const { data: variants } = await supabase.from('product_variants').select('*').eq('product_id', vest.id);
    console.log('Vest variants:', variants);

    if (variants.length === 1) {
      console.log('Adding test variant...');
      const { error } = await supabase.from('product_variants').insert({
        product_id: vest.id,
        name: 'Large / Black',
        sku: 'VEST-L-BLK',
        price: 4.00,
      });
      if (error) console.log('Error adding variant:', error);
      else console.log('Successfully added variant');
    }
  } else {
    console.log('Vest not found.');
  }
}

checkVariants();
