import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

let url = '';
let key = '';

for (const line of envContent.split('\n')) {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) key = line.split('=')[1].trim();
}

const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

async function debugAuth() {
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
  
  if (userError) {
    console.error("Error fetching users:", userError);
    return;
  }

  console.log("Registered Users in Auth:");
  users.forEach(u => console.log(`- ${u.email} (ID: ${u.id})`));

  const { data: profiles, error: profileError } = await supabase.from('profiles').select('*');
  
  if (profileError) {
    console.error("Error fetching profiles:", profileError);
    return;
  }

  console.log("\nProfiles in DB:");
  profiles.forEach(p => console.log(`- ID: ${p.id}, Role: ${p.role}, Name: ${p.full_name}`));
}

debugAuth();
