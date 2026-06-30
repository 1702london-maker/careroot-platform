-- Migration 47: Data Protection — SAR and Consent Records

-- Subject access requests (30-day legal deadline)
CREATE TABLE IF NOT EXISTS subject_access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id),
  requested_by text NOT NULL,
  -- 'client' | 'family' | 'placing_authority' | 'legal'
  requested_via text NOT NULL,
  -- 'app' | 'formal_process'
  request_date timestamptz DEFAULT now(),
  due_date timestamptz, -- legally 30 days from request
  status text DEFAULT 'received'
    CHECK (status IN ('received', 'processing', 'completed', 'extended')),
  completed_at timestamptz,
  data_package_url text,
  handled_by uuid REFERENCES users(id),
  auto_triggered boolean DEFAULT false -- true when submitted via app
);

-- Consent records for data processing, care delivery, photography, information sharing
CREATE TABLE IF NOT EXISTS consent_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id),
  consent_type text NOT NULL,
  -- 'data_processing' | 'care_delivery' | 'photography' | 'information_sharing'
  consented_by text NOT NULL,
  -- 'client' | 'legal_guardian' | 'placing_authority'
  consented_at timestamptz NOT NULL,
  consent_withdrawn_at timestamptz,
  withdrawn_by text,
  document_url text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sar_client ON subject_access_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_sar_status ON subject_access_requests(status);
CREATE INDEX IF NOT EXISTS idx_sar_due_date ON subject_access_requests(due_date);
CREATE INDEX IF NOT EXISTS idx_consent_client ON consent_records(client_id);

ALTER TABLE subject_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY sar_manager ON subject_access_requests
  FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid()) IN ('superadmin', 'org_admin', 'manager', 'coordinator')
    AND client_id IN (SELECT id FROM clients WHERE organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid()))
  );

CREATE POLICY consent_org ON consent_records
  FOR ALL USING (
    client_id IN (SELECT id FROM clients WHERE organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid()))
  );
