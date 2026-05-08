const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.join('=').trim().replace(/^"(.*)"$/, '$1');
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
  console.log('Checking products table schema...');
  // We can't directly get schema easily with supabase-js without postgres functions,
  // but we can try to fetch one row and see the keys, or use a query.
  const { data, error } = await supabase.from('products').select('*').limit(1);
  if (error) {
    console.error('Error fetching products:', error);
    return;
  }
  if (data.length > 0) {
    console.log('Sample product keys:', Object.keys(data[0]));
  } else {
    console.log('No products found to infer schema.');
    // Try to insert a dummy row and rollback? No, simpler to just use postgrest.
  }
}

checkSchema();
