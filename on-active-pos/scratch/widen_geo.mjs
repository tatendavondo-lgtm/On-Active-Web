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

async function widenGeofence() {
  const { error } = await supabase
    .from('stores')
    .update({ geofence_radius_meters: 50000 }) // 50km
    .eq('id', '00000000-0000-0000-0000-000000000001');
  
  if (error) {
    console.error('Failed to widen geofence:', error.message);
  } else {
    console.log('✅ Geofence widened to 50km for testing');
  }
}

widenGeofence();
