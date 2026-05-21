import pg from 'pg';
const { Client } = pg;

const DB_PASSWORD = 'BNzfTy9hHvPDRdqP';
const DB_HOST = 'db.hnyilsmevqenwpspuguz.supabase.co';

const pgClient = new Client({
  host: DB_HOST, port: 5432, user: 'postgres', password: DB_PASSWORD, database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function checkTables() {
  try {
    await pgClient.connect();
    const res = await pgClient.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('shifts', 'pos_shifts', 'customers', 'pos_customers')");
    console.log(res.rows.map(r => r.table_name));
  } catch (err) {
    console.error(err);
  } finally {
    await pgClient.end();
  }
}

checkTables();
