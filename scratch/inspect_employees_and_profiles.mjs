import pg from 'pg';
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

async function inspect() {
  try {
    await pgClient.connect();
    
    console.log('=== INSPECTING EMPLOYEES TABLE ===');
    const empRes = await pgClient.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'employees'
    `);
    console.table(empRes.rows);

    console.log('=== INSPECTING PROFILES TABLE ===');
    const profRes = await pgClient.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'profiles'
    `);
    console.table(profRes.rows);

  } catch (err) {
    console.error(err);
  } finally {
    await pgClient.end();
  }
}

inspect();
