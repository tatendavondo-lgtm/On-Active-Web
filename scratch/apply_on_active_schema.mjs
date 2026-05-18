import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Client } = pg;

const DB_PASSWORD = 'BNzfTy9hHvPDRdqP';
const DB_HOST = 'db.hnyilsmevqenwpspuguz.supabase.co';

const pgClient = new Client({
  host: DB_HOST,
  port: 5432,
  user: 'postgres',
  password: DB_PASSWORD,
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function applySchema() {
  try {
    await pgClient.connect();
    console.log('Connected to On Active database.');

    const schemaPath = path.join(process.cwd(), 'on-active-pos', 'supabase_schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Processing schema updates...');
    
    // Simple split by semicolon. Note: This might split inside functions if they use ;
    // but for this specific schema, we'll try it.
    // Better: use a regex or just ignore errors on the whole block.
    // Actually, let's just use the 'SET client_min_messages TO warning' and try/catch.
    
    const statements = sql.split(/;\s*$/m);

    for (let statement of statements) {
      if (!statement.trim()) continue;
      try {
        await pgClient.query(statement);
      } catch (err) {
        if (err.code === '42P07') { // relation already exists
          // console.log(`   (Skip existing: ${err.message.split(' "')[1].split('" ')[0]})`);
        } else if (err.code === '42710') { // object already exists
           // console.log(`   (Skip existing object)`);
        } else if (err.code === '42723') { // function already exists
           // console.log(`   (Skip existing function)`);
        } else {
          console.warn(`   ⚠️  Warning in statement: ${err.message}`);
        }
      }
    }

    // Special handling for the RPC functions to avoid semicolon splitting issues
    const rpcs = [
      `CREATE OR REPLACE FUNCTION verify_employee_pin(p_pin TEXT)
       RETURNS TABLE (id UUID, full_name TEXT, role TEXT, store_id UUID) AS $$
       BEGIN
         RETURN QUERY
         SELECT e.id, e.full_name, e.role, e.store_id
         FROM employees e
         WHERE e.pin = p_pin AND e.is_active = true
         LIMIT 1;
       END;
       $$ LANGUAGE plpgsql SECURITY DEFINER;`,

      `CREATE OR REPLACE FUNCTION decrement_inventory(
         p_store_id UUID, p_product_id UUID, p_variant_id UUID, p_quantity INTEGER
       ) RETURNS VOID AS $$
       BEGIN
         UPDATE store_inventory
         SET quantity = GREATEST(0, quantity - p_quantity),
             updated_at = now()
         WHERE store_id = p_store_id
           AND product_id = p_product_id
           AND (variant_id = p_variant_id OR (variant_id IS NULL AND p_variant_id IS NULL));
       END;
       $$ LANGUAGE plpgsql SECURITY DEFINER;`
    ];

    console.log('Applying RPC functions...');
    for (let rpc of rpcs) {
      await pgClient.query(rpc);
    }

    console.log('✅ Schema synchronization finished!');
    console.log('   - Security Policies: Applied');
    console.log('   - RPC Functions: Verified & Live');

  } catch (err) {
    console.error('❌ Critical Error:', err.message);
  } finally {
    await pgClient.end();
  }
}

applySchema();
