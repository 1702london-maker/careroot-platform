-- Migration 29: Device Registration
-- Staff use personal phones registered by company via IMEI

CREATE TABLE IF NOT EXISTS registered_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES users(id),
  imei text UNIQUE NOT NULL,
  device_model text,
  registered_by uuid REFERENCES users(id),
  registered_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  deactivated_at timestamptz,
  deactivated_by uuid REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_registered_devices_staff ON registered_devices(staff_id);
CREATE INDEX IF NOT EXISTS idx_registered_devices_imei ON registered_devices(imei);

ALTER TABLE registered_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY registered_devices_org_isolation ON registered_devices
  FOR ALL USING (
    staff_id IN (SELECT id FROM users WHERE organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid()))
  );
