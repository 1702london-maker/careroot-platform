-- Staff complaints table
CREATE TABLE IF NOT EXISTS staff_complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  reported_by UUID REFERENCES users(id),
  reporter_name TEXT NOT NULL,
  complaint_type TEXT NOT NULL,
  subject TEXT,
  description TEXT NOT NULL,
  incident_date DATE,
  location TEXT,
  witnesses TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  escalate_to TEXT DEFAULT 'manager',
  status TEXT NOT NULL DEFAULT 'submitted',
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE staff_complaints ENABLE ROW LEVEL SECURITY;

-- Staff can submit complaints; managers/admins can view all
CREATE POLICY "staff can submit complaints"
  ON staff_complaints FOR INSERT
  WITH CHECK (
    organisation_id IN (SELECT organisation_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "managers can view and manage complaints"
  ON staff_complaints FOR ALL
  USING (
    organisation_id IN (
      SELECT organisation_id FROM users
      WHERE id = auth.uid()
      AND role IN ('org_admin', 'manager', 'superadmin', 'coordinator')
    )
  );

-- Staff can view their own non-anonymous complaints
CREATE POLICY "staff can view own complaints"
  ON staff_complaints FOR SELECT
  USING (
    reported_by = auth.uid() AND is_anonymous = false
  );

-- Body map injuries (if not already created)
CREATE TABLE IF NOT EXISTS body_map_injuries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  region_key TEXT NOT NULL,
  region_label TEXT NOT NULL,
  alert_level TEXT NOT NULL DEFAULT 'monitor' CHECK (alert_level IN ('normal', 'monitor', 'attention')),
  care_instruction TEXT NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (client_id, region_key)
);

ALTER TABLE body_map_injuries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can manage body map"
  ON body_map_injuries FOR ALL
  USING (
    organisation_id IN (SELECT organisation_id FROM users WHERE id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS body_map_client_idx ON body_map_injuries(client_id);
