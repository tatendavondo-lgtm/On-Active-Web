require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fix() {
  console.log('Fixing inactive POS PINs...');
  const { data: inactives } = await supabase.from('employees').select('id').eq('is_active', false);
  if (inactives) {
    for (const emp of inactives) {
      const randomSuf = Math.floor(Math.random() * 100000);
      await supabase.from('employees').update({ 
        pin: 'del_' + randomSuf,
        email: 'del_' + randomSuf + '@deleted.com',
        phone: 'del_' + randomSuf
      }).eq('id', emp.id);
    }
    console.log(`Fixed ${inactives.length} inactive employees.`);
  }

  console.log('Done.');
}
fix();
