import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

async function testShifts() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  let url = '';
  let serviceKey = '';
  envContent.split('\n').forEach(line => {
    if (line.trim().startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/^"(.*)"$/, '$1');
    if (line.trim().startsWith('SUPABASE_SERVICE_ROLE_KEY=')) serviceKey = line.split('=')[1].trim().replace(/^"(.*)"$/, '$1');
  });

  const supabase = createClient(url, serviceKey);

  console.log('Testing shifts fetch...');
  const { data, error } = await supabase.from('shifts').select('id, employee_id, store_id, opened_at, opening_cash').eq('status', 'open');

  if (error) {
    console.error('shifts error:', error);
  } else {
    console.log('Shifts fetched successfully:', data);
  }
}

testShifts();
