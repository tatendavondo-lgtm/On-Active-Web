import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const env = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
let url = '', key = '';
for (const l of env.split('\n')) {
  if (l.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = l.split('=').slice(1).join('=').trim();
  if (l.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) key = l.split('=').slice(1).join('=').trim();
}
const sb = createClient(url, key);

const now = new Date();
console.log('Current UTC time:', now.toISOString());
console.log('Local time (CAT +02):', now.toLocaleString());

const today = new Date();
today.setHours(0, 0, 0, 0);
const todayISO = today.toISOString();
console.log('Start of today ISO:', todayISO);

// Check ALL shifts, not just today's
const { data: allShifts } = await sb.from('shifts').select('id, status, opened_at, employee_id, employees!inner(full_name, role)').order('opened_at', { ascending: false }).limit(20);
console.log('\n=== ALL RECENT SHIFTS ===');
allShifts?.forEach(s => console.log(` [${s.status}] ${s.employees?.full_name} (${s.employees?.role}) opened: ${s.opened_at}`));

// Check specifically today's shifts
const { data: todayShifts } = await sb.from('shifts').select('id, status, opened_at, employees!inner(role, full_name)').eq('status', 'open').gte('opened_at', todayISO);
console.log('\n=== OPEN SHIFTS OPENED TODAY ===');
console.log('Count:', todayShifts?.length);
todayShifts?.forEach(s => console.log(` - ${s.employees?.full_name} (${s.employees?.role}) at ${s.opened_at}`));

// What does midnight look like for different timezones?
const todayUTC = new Date();
todayUTC.setUTCHours(0, 0, 0, 0);
console.log('\nMidnight UTC today:', todayUTC.toISOString());
const { data: utcShifts } = await sb.from('shifts').select('id, status, opened_at, employees!inner(role)').eq('status', 'open').gte('opened_at', todayUTC.toISOString());
console.log('Shifts since UTC midnight:', utcShifts?.length);
