import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hnyilsmevqenwpspuguz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhueWlsc21ldnFlbndwc3B1Z3V6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDk4MTg1MiwiZXhwIjoyMDkwNTU3ODUyfQ.1a0VP9pNtBlAP2kNLaGEIwU4LHSoeIIhrzmdSuahaxs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Updating whatsapp_number in settings table...");
  const { data, error } = await supabase
    .from('settings')
    .upsert({ key: 'whatsapp_number', value: '+263782610691' }, { onConflict: 'key' })
    .select();

  if (error) {
    console.error("Error updating settings:", error);
  } else {
    console.log("Success! Updated data:", data);
  }
}

run();
