import pg from 'pg';
const { Client } = pg;

const DB_PASSWORD = 'BNzfTy9hHvPDRdqP';
const DB_HOST = 'db.hnyilsmevqenwpspuguz.supabase.co';

const pgClient = new Client({
  host: DB_HOST, port: 5432, user: 'postgres', password: DB_PASSWORD, database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function countData() {
  try {
    await pgClient.connect();
    const tables = ['shifts', 'pos_shifts', 'customers', 'pos_customers'];
    for (const t of tables) {
      const res = await pgClient.query(`SELECT count(*) FROM ${t}`);
      console.log(`${t}: ${res.rows[0].count}`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pgClient.end();
  }
}

countData();
