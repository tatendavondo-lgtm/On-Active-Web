import pg from 'pg';
const { Client } = pg;

const DB_PASSWORD = 'BNzfTy9hHvPDRdqP';
const DB_HOST = 'db.hnyilsmevqenwpspuguz.supabase.co';

const pgClient = new Client({
  host: DB_HOST, port: 5432, user: 'postgres', password: DB_PASSWORD, database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    await pgClient.connect();
    console.log('Connected to DB for migration.');

    const sql = `
      ALTER TABLE online_order_bridge 
      ADD COLUMN IF NOT EXISTS customer_name TEXT,
      ADD COLUMN IF NOT EXISTS customer_phone TEXT,
      ADD COLUMN IF NOT EXISTS customer_email TEXT,
      ADD COLUMN IF NOT EXISTS items JSONB,
      ADD COLUMN IF NOT EXISTS total NUMERIC(10,2),
      ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ DEFAULT now();
    `;

    await pgClient.query(sql);
    console.log('✅ online_order_bridge schema updated successfully!');
  } catch (err) {
    console.error('❌ Migration Error:', err.message);
  } finally {
    await pgClient.end();
  }
}

migrate();
