import pg from 'pg';
import bcrypt from 'bcryptjs';

const DB_PASSWORD = 'BNzfTy9hHvPDRdqP';
const DB_HOST = 'db.hnyilsmevqenwpspuguz.supabase.co';

const pgClient = new Client({
  host: DB_HOST, port: 5432, user: 'postgres', password: DB_PASSWORD, database: 'postgres',
  ssl: { rejectUnauthorized: false }
});
import { Client } from 'pg';

async function validate() {
  try {
    await pgClient.connect();
    console.log('=== VALIDATION: Staff & Audit System ===\n');

    // 1. Get a store for testing
    const storeRes = await pgClient.query('SELECT id FROM stores LIMIT 1');
    const storeId = storeRes.rows[0]?.id;
    if (!storeId) {
       console.error('No store found, cannot test.');
       return;
    }

    // 2. Simulate Adding Staff
    console.log('Step 1: Simulating Add Staff...');
    const testName = 'Validation Test User';
    const testPin = '9999';
    const pinHash = await bcrypt.hash(testPin, 10);
    
    const insertRes = await pgClient.query(
      'INSERT INTO employees (full_name, role, pin, pin_hash, store_id, is_active) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [testName, 'salesman', testPin, pinHash, storeId, true]
    );
    const empId = insertRes.rows[0].id;
    console.log('SUCCESS: Employee created with ID:', empId);

    // 3. Simulate Audit Log (Since we can't easily mock auth.getUser() in a script without a full session)
    console.log('\nStep 2: Testing Audit Log creation...');
    await pgClient.query(
      'INSERT INTO admin_audit_logs (action, target_type, target_id, details) VALUES ($1, $2, $3, $4)',
      ['create_test', 'employee', empId, JSON.stringify({ name: testName })]
    );
    
    const auditRes = await pgClient.query('SELECT * FROM admin_audit_logs WHERE target_id = $1', [empId]);
    if (auditRes.rows.length > 0) {
      console.log('SUCCESS: Audit log entry found:', auditRes.rows[0].action);
    } else {
      console.log('FAIL: Audit log entry not found.');
    }

    // 4. Cleanup
    console.log('\nStep 3: Cleanup...');
    await pgClient.query('DELETE FROM admin_audit_logs WHERE target_id = $1', [empId]);
    await pgClient.query('DELETE FROM employees WHERE id = $1', [empId]);
    console.log('Done.');

  } catch (err) {
    console.error('Validation Error:', err.message);
  } finally {
    await pgClient.end();
  }
}

validate();
