import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

async function resetPassword() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  let url = '';
  let key = '';
  
  envContent.split('\n').forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      url = line.split('=')[1].trim().replace(/^"(.*)"$/, '$1');
    }
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
      key = line.split('=')[1].trim().replace(/^"(Salesman.*)"$/, '$1'); // wait, let's just trim properly
    }
  });

  // Let's do exact parsing
  for (const line of envContent.split('\n')) {
    if (line.trim().startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      url = line.split('=')[1].trim();
    }
    if (line.trim().startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
      key = line.split('=')[1].trim();
    }
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data, error } = await supabase.auth.admin.updateUserById(
    'ef904bcc-3aef-4858-88c2-64513dab7807',
    { password: 'OnActive123!' }
  );

  if (error) console.error('Error resetting password:', error);
  else console.log('Successfully reset password for admin@onactive.co.zw to OnActive123!');
}

resetPassword();
