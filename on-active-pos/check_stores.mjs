import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkStores() {
  const { data, error } = await supabase.from('stores').select('*');
  console.log('Stores:', data);
  if (error) console.error(error);
}

checkStores();
