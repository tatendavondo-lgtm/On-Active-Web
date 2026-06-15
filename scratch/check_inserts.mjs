import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  // We check for 'hubyubyub' which the user entered in the latest screenshot
  const { data, error } = await supabase.from('employees').select('*').eq('full_name', 'hubyubyub');
  console.log("Employees hubyubyub:", data);

  // Check for ygygyg from the second screenshot
  const { data: data2 } = await supabase.from('employees').select('*').eq('full_name', 'ygygyg');
  console.log("Employees ygygyg:", data2);
}

check();
