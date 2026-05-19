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
    console.log('Connected to DB for full bridge migration.');

    const sql = `
      -- 1. Ensure columns exist
      ALTER TABLE online_order_bridge 
      ADD COLUMN IF NOT EXISTS webstore_order_id UUID,
      ADD COLUMN IF NOT EXISTS pos_order_id UUID,
      ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS ready_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

      -- 2. Add constraint if possible
      -- We'll skip for now to avoid errors on existing data, but columns are the priority.
    `;

    await pgClient.query(sql);
    console.log('✅ online_order_bridge schema fully restored!');
  } catch (err) {
    console.error('❌ Migration Error:', err.message);
  } finally {
    await pgClient.end();
  }
}

migrate();
