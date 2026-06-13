import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAdd() {
  try {
    const pinHash = await bcrypt.hash('1234', 10);
    
    // Fetch a store ID
    const { data: stores } = await supabase.from('stores').select('id').limit(1);
    const storeId = stores?.[0]?.id;
    
    if (!storeId) {
      console.log("No store found");
      return;
    }
    
    console.log("Inserting employee...");
    const { data, error } = await supabase
      .from('employees')
      .insert({
        full_name: 'test',
        role: 'salesman',
        pin: '1234',
        pin_hash: pinHash,
        store_id: storeId,
        email: 'test@gmail.com',
        phone: '08883271117',
        is_active: true,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Insert Error:", error);
    } else {
      console.log("Success:", data);
      
      console.log("Logging action...");
      // Simulate logAction
      const { error: logError } = await supabase.from('audit_logs').insert({
        user_id: '22b64021-1b61-4dfc-8df2-0e9ba1efb36a', // Samu's ID
        user_name: 'Samu Sibanda',
        user_role: 'owner',
        source: 'admin',
        action: 'create',
        target_type: 'employee',
        target_id: data.id,
        details: { name: 'test', role: 'salesman' },
      });
      if (logError) console.error("Log Error:", logError);
      else console.log("Log success");
    }
  } catch (err) {
    console.error("Caught error:", err);
  }
}

testAdd();
