import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAdd() {
  const pinHash = await bcrypt.hash('7777', 10);
  
  // Fetch a store ID
  const { data: stores } = await supabase.from('stores').select('id').limit(1);
  const storeId = stores?.[0]?.id;
  
  console.log("Inserting employee...");
  const { data, error } = await supabase
    .from('employees')
    .insert({
      full_name: 'dsdvds',
      role: 'salesman',
      pin: '7777',
      pin_hash: pinHash,
      store_id: storeId,
      email: 'sdvvvdv', // Invalid email
      phone: '4444',
      is_active: true,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Insert Error:", error);
  } else {
    console.log("Success:", data);
    // Cleanup
    await supabase.from('employees').delete().eq('id', data.id);
  }
}

testAdd();
