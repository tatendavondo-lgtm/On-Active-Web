import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

let url = '';
let key = '';
for (const line of envContent.split('\n')) {
  if (line.trim().startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.trim().startsWith('SUPABASE_SERVICE_ROLE_KEY=')) key = line.split('=')[1].trim();
}

const supabase = createClient(url, key);

async function inspect() {
  const { data: shifts, error } = await supabase
    .from('shifts')
    .select('id, employee_id, store_id, employee:employees(role)')
    .eq('status', 'open');

  console.log("Open Shifts (employee):", shifts);
  if (error) console.error("Error (employee):", error);

  const { data: shiftsPlural, error: errorPlural } = await supabase
    .from('shifts')
    .select('id, employee_id, store_id, employees:employees(role)')
    .eq('status', 'open');

  console.log("Open Shifts (employees):", shiftsPlural);
  if (errorPlural) console.error("Error (employees):", errorPlural);
}

inspect();
