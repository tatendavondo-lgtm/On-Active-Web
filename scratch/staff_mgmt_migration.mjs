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
    console.log('Connected to DB for Staff Management enhancements.');

    const sql = `
      -- 1. Create Audit Logs table
      CREATE TABLE IF NOT EXISTS admin_audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        admin_id UUID REFERENCES auth.users(id),
        action TEXT NOT NULL,
        target_type TEXT NOT NULL,
        target_id TEXT,
        details JSONB,
        created_at TIMESTAMPTZ DEFAULT now()
      );

      -- 2. Add email/phone to employees if missing (already checked but double safety)
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS email TEXT;
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS phone TEXT;

      -- 3. Trigger to auto-set role for new profiles if they were invited or as default
      CREATE OR REPLACE FUNCTION handle_new_user_profile()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO public.profiles (id, full_name, role, created_at)
        VALUES (
          new.id, 
          new.raw_user_meta_data->>'full_name', 
          COALESCE(new.raw_user_meta_data->>'role', 'manager'), 
          now()
        )
        ON CONFLICT (id) DO UPDATE
        SET role = EXCLUDED.role;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      -- Check if trigger exists before creating
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
          CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE FUNCTION handle_new_user_profile();
        END IF;
      END $$;
    `;

    await pgClient.query(sql);
    console.log('✅ Audit logs and role triggers established!');
  } catch (err) {
    console.error('❌ Migration Error:', err.message);
  } finally {
    await pgClient.end();
  }
}

migrate();
