-- Migration 42: Safeguarding Concerns
-- Bypass option routes directly to safeguarding lead, not through line manager

CREATE TABLE IF NOT EXISTS safeguarding_concerns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id uuid REFERENCES shifts(id),
  client_id uuid REFERENCES clients(id),
  staff_id uuid REFERENCES users(id),
  concern_description text NOT NULL,
  server_timestamp timestamptz DEFAULT now(),
  gps_lat decimal,
  gps_lng decimal,
  photo_evidence_urls text[],
  -- BYPASS LINE MANAGER OPTION (true when line manager is subject of concern)
  bypass_line_manager boolean DEFAULT false,
  notified_safeguarding_lead_at timestamptz,
  notified_manager_at timestamptz, -- null if bypass selected
  escalated_to_local_authority boolean DEFAULT false,
  escalated_at timestamptz,
  status text DEFAULT 'open'
    CHECK (status IN ('open', 'under_review', 'escalated', 'closed'))
);

CREATE INDEX IF NOT EXISTS idx_safeguarding_client ON safeguarding_concerns(client_id);
CREATE INDEX IF NOT EXISTS idx_safeguarding_status ON safeguarding_concerns(status);
CREATE INDEX IF NOT EXISTS idx_safeguarding_timestamp ON safeguarding_concerns(server_timestamp);

ALTER TABLE safeguarding_concerns ENABLE ROW LEVEL SECURITY;

-- All managers and safeguarding leads see all concerns in their org
CREATE POLICY safeguarding_manager ON safeguarding_concerns
  FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid()) IN ('superadmin', 'org_admin', 'manager', 'coordinator')
    AND staff_id IN (SELECT id FROM users WHERE organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid()))
  );

-- Staff can see concerns they submitted
CREATE POLICY safeguarding_own ON safeguarding_concerns
  FOR SELECT USING (staff_id = auth.uid());
