import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanup() {
  console.log("Deleting test employees...");
  const { error } = await supabase.from('employees').delete().eq('email', 'test@gmail.com');
  if (error) {
    console.error("Cleanup Error:", error);
  } else {
    console.log("Successfully deleted test employees.");
  }
}

cleanup();
