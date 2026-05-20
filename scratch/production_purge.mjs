import pg from 'pg';
const { Client } = pg;

const DB_PASSWORD = 'BNzfTy9hHvPDRdqP';
const DB_HOST = 'db.hnyilsmevqenwpspuguz.supabase.co';

const pgClient = new Client({
  host: DB_HOST, port: 5432, user: 'postgres', password: DB_PASSWORD, database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function purge() {
  try {
    await pgClient.connect();
    console.log('--- PURGING TEST DATA ---');

    // 1. Delete Test Orders
    const orders = await pgClient.query(`
      DELETE FROM pending_orders WHERE order_ref LIKE 'TEST-%' OR order_ref LIKE 'SMOKE-%'
    `);
    console.log(`Deleted ${orders.rowCount} test web orders.`);

    // 2. Delete Test POS Orders
    const pos = await pgClient.query(`
      DELETE FROM pos_orders WHERE order_number LIKE 'AI-%' OR order_number LIKE 'SMOKE-%'
    `);
    console.log(`Deleted ${pos.rowCount} test POS orders.`);

    // 3. Delete Bridge test entries
    const bridge = await pgClient.query(`
      DELETE FROM online_order_bridge WHERE customer_name = 'Smoke Tester' OR customer_name = 'Test Customer'
    `);
    console.log(`Deleted ${bridge.rowCount} bridge test records.`);

    // 4. Delete Test Staff
    const staff = await pgClient.query(`
      DELETE FROM employees WHERE full_name LIKE 'Smoke Test%' OR full_name = 'Validation Test User'
    `);
    console.log(`Deleted ${staff.rowCount} test staff members.`);

    // 5. Clean Audit Logs
    const logs = await pgClient.query(`
      DELETE FROM admin_audit_logs WHERE action LIKE 'smoke_test_%' OR action = 'create_test'
    `);
    console.log(`Deleted ${logs.rowCount} test audit logs.`);

    console.log('\n✅ DATABASE IS NOW CLEAN AND READY FOR REAL DATA.');
  } catch (err) {
    console.error('Purge Error:', err.message);
  } finally {
    await pgClient.end();
  }
}

purge();
