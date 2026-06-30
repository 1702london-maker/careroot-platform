-- Migration 33: Shifts + FK back to shift_credentials

CREATE TABLE IF NOT EXISTS shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES organisations(id),
  service_line_id uuid REFERENCES service_lines(id),
  staff_id uuid REFERENCES users(id),
  client_ids uuid[], -- array for multi-client domiciliary shifts
  scheduled_start timestamptz NOT NULL,
  scheduled_end timestamptz NOT NULL,
  actual_start timestamptz,
  actual_end timestamptz,
  access_opens_at timestamptz, -- = scheduled_start
  access_closes_at timestamptz, -- = scheduled_end + 30 minutes
  status text DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'active', 'completed', 'missed')),
  created_at timestamptz DEFAULT now()
);

-- Add FK from shift_credentials to shifts now that shifts exists
ALTER TABLE shift_credentials
  ADD CONSTRAINT fk_shift_credentials_shift
  FOREIGN KEY (shift_id) REFERENCES shifts(id);

CREATE INDEX IF NOT EXISTS idx_shifts_staff ON shifts(staff_id);
CREATE INDEX IF NOT EXISTS idx_shifts_status ON shifts(status);
CREATE INDEX IF NOT EXISTS idx_shifts_scheduled_start ON shifts(scheduled_start);
CREATE INDEX IF NOT EXISTS idx_shifts_organisation ON shifts(organisation_id);

ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY shifts_org_isolation ON shifts
  FOR ALL USING (
    organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
  );
