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
    console.log('Connected to DB for adding order_ref column.');

    const sql = `
      ALTER TABLE online_order_bridge 
      ADD COLUMN IF NOT EXISTS order_ref TEXT;
    `;

    await pgClient.query(sql);
    console.log('✅ Added order_ref column to online_order_bridge table!');
  } catch (err) {
    console.error('❌ Migration Error:', err.message);
  } finally {
    await pgClient.end();
  }
}

migrate();
