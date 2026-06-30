-- Migration 35: Extend existing clients table for multi-service-line operation
-- clients table already exists (migration 003); adding new columns only

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS service_line_id uuid REFERENCES service_lines(id),
  ADD COLUMN IF NOT EXISTS reference_number text,
  ADD COLUMN IF NOT EXISTS gps_lat decimal,
  ADD COLUMN IF NOT EXISTS gps_lng decimal,
  ADD COLUMN IF NOT EXISTS approved_radius_metres integer DEFAULT 300,
  ADD COLUMN IF NOT EXISTS commissioner text,
  ADD COLUMN IF NOT EXISTS placing_authority text,
  ADD COLUMN IF NOT EXISTS package_start_date date,
  ADD COLUMN IF NOT EXISTS package_end_date date,
  ADD COLUMN IF NOT EXISTS access_revoked_at timestamptz,
  ADD COLUMN IF NOT EXISTS access_revoked_by uuid REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS data_retention_until date;
  -- CQC: 8 years post package end
  -- Children: 25th birthday or 8 years post last entry whichever later

-- Unique constraint on reference_number (allow null for existing rows)
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_reference_number
  ON clients(reference_number) WHERE reference_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clients_service_line ON clients(service_line_id);
CREATE INDEX IF NOT EXISTS idx_clients_package_end ON clients(package_end_date);
