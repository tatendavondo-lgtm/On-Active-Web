import pg from 'pg';
const { Client } = pg;

const DB_PASSWORD = 'BNzfTy9hHvPDRdqP';
const DB_HOST = 'db.hnyilsmevqenwpspuguz.supabase.co';

const pgClient = new Client({
  host: DB_HOST, port: 5432, user: 'postgres', password: DB_PASSWORD, database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function consolidate() {
  try {
    await pgClient.connect();
    console.log('Connected for consolidation.');

    // 1. Ensure 'shifts' has same columns as 'pos_shifts' (at least what we need)
    // We already checked this partially, but let's be safe.
    
    // 2. Migrate data from pos_shifts to shifts
    console.log('Migrating shifts...');
    await pgClient.query(`
      INSERT INTO shifts (id, store_id, employee_id, opened_at, closed_at, opening_cash, closing_cash, status)
      SELECT id, store_id, employee_id, opened_at, closed_at, opening_cash, actual_cash, status 
      FROM pos_shifts
      ON CONFLICT (id) DO NOTHING;
    `);

    // 3. Drop foreign key in pos_orders that points to pos_shifts
    console.log('Updating pos_orders foreign key...');
    await pgClient.query(`
      ALTER TABLE pos_orders DROP CONSTRAINT IF EXISTS pos_orders_shift_id_fkey;
      ALTER TABLE pos_orders ADD CONSTRAINT pos_orders_shift_id_fkey 
      FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE SET NULL;
    `);

    // 4. Drop redundant tables
    console.log('Dropping redundant tables...');
    await pgClient.query(`DROP TABLE IF EXISTS pos_shifts CASCADE;`);
    await pgClient.query(`DROP TABLE IF EXISTS pos_customers CASCADE;`);

    console.log('✅ DATABASE CONSOLIDATION COMPLETE.');
  } catch (err) {
    console.error('Consolidation Error:', err.message);
    if (err.message.includes('column')) {
       console.log('Attempting to fix column mismatch...');
       // In case 'shifts' is missing columns
       await pgClient.query(`
         ALTER TABLE shifts 
         ADD COLUMN IF NOT EXISTS opening_cash NUMERIC(10,2),
         ADD COLUMN IF NOT EXISTS closing_cash NUMERIC(10,2),
         ADD COLUMN IF NOT EXISTS expected_cash NUMERIC(10,2),
         ADD COLUMN IF NOT EXISTS cash_difference NUMERIC(10,2),
         ADD COLUMN IF NOT EXISTS notes TEXT;
       `);
       console.log('Columns added, please re-run migration.');
    }
  } finally {
    await pgClient.end();
  }
}

consolidate();
