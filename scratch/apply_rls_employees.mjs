import pkg from 'pg';
const { Client } = pkg;

const connectionString = "postgresql://postgres:BNzfTy9hHvPDRdqP@db.hnyilsmevqenwpspuguz.supabase.co:5432/postgres";

async function applyRLSPolicy() {
  const client = new Client({ connectionString });
  await client.connect();

  console.log("Applying RLS policies for employees table...");
  try {
    // 1. Drop existing policies to prevent conflicts
    await client.query(`DROP POLICY IF EXISTS "Admins can manage employees" ON employees;`);
    
    // 2. Create the new all-permissive policy for owners and managers
    await client.query(`
      CREATE POLICY "Admins can manage employees" ON employees
        FOR ALL
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role IN ('owner', 'manager')
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role IN ('owner', 'manager')
          )
        );
    `);
    
    console.log("Successfully applied RLS policy 'Admins can manage employees'!");
  } catch (err) {
    console.error("Error applying RLS policy:", err.message);
  } finally {
    await client.end();
  }
}

applyRLSPolicy();
