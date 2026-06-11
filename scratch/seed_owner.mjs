import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE env vars. Ensure .env.local has NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  const email = 'samusibanda1@gmail.com';
  const password = 'Keespace@1';

  console.log('Seeding user:', email);

  // 1. Create or update user
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
  
  let user = usersData?.users?.find(u => u.email === email);

  if (user) {
    console.log('User exists. Updating password...');
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(user.id, { password, user_metadata: { full_name: 'Samu Sibanda' } });
    if (updateError) {
      console.error('Error updating password:', updateError);
      return;
    }
    user = updateData.user;
  } else {
    console.log('User not found. Creating new user...');
    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: 'Samu Sibanda' }
    });
    if (createError) {
      console.error('Error creating user:', createError);
      return;
    }
    user = createData.user;
  }

  // 2. Ensure profile exists and role is owner
  console.log('Ensuring profile is set to OWNER for user:', user.id);
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: user.id,
    role: 'owner',
    full_name: 'Samu Sibanda'
  });

  if (profileError) {
    console.error('Error updating profile:', profileError);
  } else {
    console.log('\n✅ SUCCESS: Owner account has been fully seeded and verified.');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Role: owner`);
  }
}

run();
