-- Migration 34: Shift Access Log
-- Full audit trail — every login, action, GPS check. Server timestamp only.

CREATE TABLE IF NOT EXISTS shift_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id uuid REFERENCES shifts(id),
  staff_id uuid REFERENCES users(id),
  device_imei text,
  action_type text NOT NULL,
  -- 'login' | 'logout' | 'page_view' | 'record_created'
  -- | 'record_edited' | 'auto_logout' | 'forced_logout'
  gps_lat decimal,
  gps_lng decimal,
  gps_accuracy_metres integer,
  within_approved_radius boolean,
  server_timestamp timestamptz DEFAULT now(), -- NEVER device timestamp
  metadata jsonb
);

CREATE INDEX IF NOT EXISTS idx_shift_access_log_shift ON shift_access_log(shift_id);
CREATE INDEX IF NOT EXISTS idx_shift_access_log_staff ON shift_access_log(staff_id);
CREATE INDEX IF NOT EXISTS idx_shift_access_log_timestamp ON shift_access_log(server_timestamp);

ALTER TABLE shift_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY shift_access_log_manager ON shift_access_log
  FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid()) IN ('superadmin', 'org_admin', 'manager', 'coordinator')
    AND staff_id IN (SELECT id FROM users WHERE organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid()))
  );

CREATE POLICY shift_access_log_own ON shift_access_log
  FOR SELECT USING (staff_id = auth.uid());
