import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

async function testLogin() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  let url = '';
  let anonKey = '';
  
  envContent.split('\n').forEach(line => {
    if (line.trim().startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      url = line.split('=')[1].trim().replace(/^"(.*)"$/, '$1');
    }
    if (line.trim().startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
      anonKey = line.split('=')[1].trim().replace(/^"(.*)"$/, '$1');
    }
  });

  console.log('Connecting to:', url);
  const supabase = createClient(url, anonKey);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@onactive.co.zw',
    password: 'OnActive123!'
  });

  if (error) {
    console.error('Login error:', error);
  } else {
    console.log('Login successful!', data);
  }
}

testLogin();
