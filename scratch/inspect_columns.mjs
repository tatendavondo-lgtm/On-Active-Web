import pg from 'pg';
const { Client } = pg;

const DB_PASSWORD = 'BNzfTy9hHvPDRdqP';
const DB_HOST = 'db.hnyilsmevqenwpspuguz.supabase.co';

const pgClient = new Client({
  host: DB_HOST, port: 5432, user: 'postgres', password: DB_PASSWORD, database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function inspect() {
  try {
    await pgClient.connect();
    const res = await pgClient.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'online_order_bridge'
    `);
    console.log('Columns in online_order_bridge:', res.rows.map(r => r.column_name).join(', '));
  } catch (err) {
    console.error(err);
  } finally {
    await pgClient.end();
  }
}

inspect();
