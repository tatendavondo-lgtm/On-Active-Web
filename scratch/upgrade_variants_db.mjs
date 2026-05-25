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
    console.log('Connected for variant upgrade.');

    const sql = `
      -- 1. Upgrade product_variants table
      ALTER TABLE product_variants 
      ADD COLUMN IF NOT EXISTS size TEXT,
      ADD COLUMN IF NOT EXISTS color TEXT,
      ADD COLUMN IF NOT EXISTS image_url TEXT;

      -- 2. Update existing 'Standard' variants if any
      UPDATE product_variants SET size = name WHERE size IS NULL AND name != 'Standard';
      UPDATE product_variants SET size = 'One Size' WHERE name = 'Standard' AND size IS NULL;
    `;

    await pgClient.query(sql);
    console.log('✅ DATABASE UPGRADED FOR COLOR/SIZE VARIANTS.');
  } catch (err) {
    console.error('Migration Error:', err.message);
  } finally {
    await pgClient.end();
  }
}

migrate();
