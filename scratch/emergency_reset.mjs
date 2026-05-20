import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hnyilsmevqenwpspuguz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhueWlsc21ldnFlbndwc3B1Z3V6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDk4MTg1MiwiZXhwIjoyMDkwNTU3ODUyfQ.1a0VP9pNtBlAP2kNLaGEIwU4LHSoeIIhrzmdSuahaxs';
const supabase = createClient(supabaseUrl, supabaseKey);

async function reset() {
  const email = 'admin@onactive.co.zw';
  const newPassword = 'OnActiveAdmin2026!'; // Temporary secure password

  console.log(`Resetting password for ${email}...`);

  // We need to find the user ID first
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Error listing users:', listError.message);
    return;
  }

  const user = users.find(u => u.email === email);
  if (!user) {
    console.error('User not found.');
    return;
  }

  const { error } = await supabase.auth.admin.updateUserById(user.id, {
    password: newPassword
  });

  if (error) {
    console.error('Reset failed:', error.message);
  } else {
    console.log('\n--- SUCCESS ---');
    console.log(`Password reset for: ${email}`);
    console.log(`New Password: ${newPassword}`);
    console.log('----------------\n');
  }
}

reset();
