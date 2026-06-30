-- Migration 32: Shift Credentials
-- Time-limited PIN + token sent via SMS before each shift

CREATE TABLE IF NOT EXISTS shift_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES users(id),
  shift_id uuid, -- FK added in migration 033 once shifts table exists
  pin_hash text NOT NULL,
  token text UNIQUE NOT NULL,
  valid_from timestamptz NOT NULL,
  valid_until timestamptz NOT NULL,
  -- valid_until = shift_end + 30 minutes grace period
  delivered_at timestamptz,
  delivery_method text DEFAULT 'sms',
  used_at timestamptz,
  invalidated_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shift_credentials_staff ON shift_credentials(staff_id);
CREATE INDEX IF NOT EXISTS idx_shift_credentials_token ON shift_credentials(token);
CREATE INDEX IF NOT EXISTS idx_shift_credentials_valid_until ON shift_credentials(valid_until);

ALTER TABLE shift_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY shift_credentials_staff_own ON shift_credentials
  FOR SELECT USING (staff_id = auth.uid());

CREATE POLICY shift_credentials_manager_all ON shift_credentials
  FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid()) IN ('superadmin', 'org_admin', 'manager', 'coordinator')
  );
