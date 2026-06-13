import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addTillOperator() {
  try {
    const pin = '4321';
    const pinHash = await bcrypt.hash(pin, 10);
    
    // Fetch a store ID
    const { data: stores } = await supabase.from('stores').select('id, name').limit(1);
    const store = stores?.[0];
    
    if (!store) {
      console.log("No store found");
      return;
    }
    
    console.log(`Adding to store: ${store.name}`);
    const { data, error } = await supabase
      .from('employees')
      .insert({
        full_name: 'Till Ops 1',
        role: 'till_operator',
        pin: pin,
        pin_hash: pinHash,
        store_id: store.id,
        is_active: true,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Insert Error:", error);
    } else {
      console.log("Successfully created till operator!");
      console.log("Name:", data.full_name);
      console.log("Role:", data.role);
      console.log("PIN:", pin);
      console.log("Store:", store.name);
    }
  } catch (err) {
    console.error("Caught error:", err);
  }
}

addTillOperator();
