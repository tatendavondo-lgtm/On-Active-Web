import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

async function listUsers() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  let url = '';
  let key = '';
  
  envContent.split('\n').forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      url = line.split('=')[1].trim().replace(/^"(.*)"$/, '$1');
    }
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
      key = line.split('=')[1].trim().replace(/^"(.*)"$/, '$1');
    }
  });

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) console.error('Error fetching users:', error);
  else {
    data.users.forEach(u => console.log(`Email: ${u.email}, ID: ${u.id}`));
  }
}

listUsers();
