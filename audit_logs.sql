-- UNIFIED AUDIT LOGS FOR ON ACTIVE ECOSYSTEM
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,                     -- References profiles.id or employees.id
  user_name TEXT,                   -- Name of the person who did it
  user_role TEXT,                   -- Role at the time of action
  source TEXT NOT NULL,             -- 'admin' or 'pos'
  action TEXT NOT NULL,             -- e.g., 'create_product', 'delete_product', 'complete_sale'
  target_type TEXT,                 -- e.g., 'product', 'order', 'staff'
  target_id TEXT,                   -- ID of the thing being affected
  details JSONB DEFAULT '{}'::jsonb, -- Extra info (old vs new values, etc)
  store_id UUID,                    -- Store where this happened (for POS)
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for faster filtering
CREATE INDEX IF NOT EXISTS idx_audit_logs_source ON audit_logs(source);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Owner/Admin can see all logs
CREATE POLICY "Admins can see all audit logs" ON audit_logs
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('owner', 'admin') OR
    auth.role() = 'service_role'
  );

-- RPC for POS to log actions securely
CREATE OR REPLACE FUNCTION log_pos_action(
  p_user_id UUID,
  p_user_name TEXT,
  p_user_role TEXT,
  p_action TEXT,
  p_target_type TEXT,
  p_target_id TEXT,
  p_details JSONB,
  p_store_id UUID
) RETURNS VOID AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id, user_name, user_role, source, action, target_type, target_id, details, store_id
  ) VALUES (
    p_user_id, p_user_name, p_user_role, 'pos', p_action, p_target_type, p_target_id, p_details, p_store_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
