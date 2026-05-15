import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.join('c:/Users/taten/Desktop/On Active Web', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkLogin() {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('pin', '1234')
    .single();

  if (error) {
    console.log('❌ Error fetching employee 1234:', error.message);
  } else {
    console.log('✅ Employee found:', data);
  }

  const { data: stores } = await supabase.from('stores').select('*');
  console.log('Available stores:', stores);
}

checkLogin();
