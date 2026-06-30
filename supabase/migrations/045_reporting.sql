-- Migration 45: Weekly Reports and CQC Evidence Packs

-- Auto-generated weekly reports in format for placing authority / LA / Ofsted
CREATE TABLE IF NOT EXISTS weekly_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id),
  service_line_id uuid REFERENCES service_lines(id),
  week_start date NOT NULL,
  week_end date NOT NULL,
  generated_at timestamptz DEFAULT now(),
  generated_from_log_count integer,
  report_format text NOT NULL,
  -- 'local_authority' | 'placing_authority' | 'ofsted'
  content jsonb NOT NULL,
  reviewed_by uuid REFERENCES users(id),
  reviewed_at timestamptz,
  submitted_at timestamptz,
  submitted_to text,
  status text DEFAULT 'draft'
    CHECK (status IN ('draft', 'reviewed', 'submitted'))
);

-- Live CQC evidence pack — scored against five key questions
CREATE TABLE IF NOT EXISTS cqc_evidence_packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES organisations(id),
  service_line_id uuid REFERENCES service_lines(id),
  last_updated_at timestamptz DEFAULT now(),
  safe_score decimal,
  effective_score decimal,
  caring_score decimal,
  responsive_score decimal,
  well_led_score decimal,
  overall_compliance_score decimal,
  gaps jsonb, -- list of missing or expiring compliance items
  evidence_by_standard jsonb, -- structured evidence mapped to each standard
  inspection_ready boolean DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_weekly_reports_client ON weekly_reports(client_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_week ON weekly_reports(week_start);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_status ON weekly_reports(status);
CREATE INDEX IF NOT EXISTS idx_cqc_evidence_org ON cqc_evidence_packs(organisation_id);

ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE cqc_evidence_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY weekly_reports_org ON weekly_reports
  FOR ALL USING (
    client_id IN (SELECT id FROM clients WHERE organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid()))
  );

CREATE POLICY cqc_evidence_org ON cqc_evidence_packs
  FOR ALL USING (
    organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
  );
