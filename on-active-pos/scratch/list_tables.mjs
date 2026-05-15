import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envPath = 'c:/Users/taten/Desktop/On Active Web/.env.local';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function listTables() {
    // We can't query information_schema directly easily without a special RPC or postgres connection.
    // But we can try to guess or use a common one.
    // Let's try fetching from 'users' or 'profiles'
    const tables = ['profiles', 'users', 'contacts', 'clients'];
    for (const t of tables) {
        const { error } = await supabase.from(t).select('id').limit(1);
        if (!error) {
            console.log(`Table found: ${t}`);
        }
    }
}

listTables();
