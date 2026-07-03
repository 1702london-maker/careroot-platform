-- Migration: Phase 1 — Solution type segmentation + staff document/training/supervision tables
-- Apply via Supabase dashboard SQL editor or: supabase db push

-- ─────────────────────────────────────────────
-- 1. Solution type on organisations
-- ─────────────────────────────────────────────
ALTER TABLE organisations
ADD COLUMN IF NOT EXISTS solution_type TEXT NOT NULL DEFAULT 'domiciliary_care'
  CHECK (solution_type IN (
    'domiciliary_care',
    'supported_living',
    'residential_care',
    'childrens_residential',
    'childrens_supported_living',
    'fostering',
    'extra_care',
    'nursing_home'
  ));

-- ─────────────────────────────────────────────
-- 2. Compliance frameworks reference table
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS compliance_frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solution_type TEXT NOT NULL,
  framework_name TEXT NOT NULL,
  framework_code TEXT NOT NULL,
  regulator TEXT NOT NULL CHECK (regulator IN ('CQC','Ofsted','NMC','Both')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed compliance frameworks
INSERT INTO compliance_frameworks (solution_type, framework_name, framework_code, regulator) VALUES
  ('domiciliary_care',          'CQC Single Assessment Framework',          'CQC_SAF',      'CQC'),
  ('domiciliary_care',          'CQC Fundamental Standards (Regs 9-20)',    'CQC_FS',       'CQC'),
  ('supported_living',          'CQC Single Assessment Framework',          'CQC_SAF',      'CQC'),
  ('supported_living',          'CQC Fundamental Standards (Regs 9-20)',    'CQC_FS',       'CQC'),
  ('residential_care',          'CQC Single Assessment Framework',          'CQC_SAF',      'CQC'),
  ('residential_care',          'CQC Fundamental Standards (Regs 9-20)',    'CQC_FS',       'CQC'),
  ('extra_care',                'CQC Single Assessment Framework',          'CQC_SAF',      'CQC'),
  ('nursing_home',              'CQC Single Assessment Framework',          'CQC_SAF',      'CQC'),
  ('nursing_home',              'NMC Code of Practice',                     'NMC_CODE',     'NMC'),
  ('childrens_residential',     'Ofsted SCCIF',                             'OFSTED_SCCIF', 'Ofsted'),
  ('childrens_residential',     'Children Homes Regulations 2015',          'CHR_2015',     'Ofsted'),
  ('childrens_supported_living','Ofsted SCSF',                              'OFSTED_SCSF',  'Ofsted'),
  ('fostering',                 'Fostering Services Regulations 2011',      'FSR_2011',     'Ofsted'),
  ('fostering',                 'Ofsted Inspection Framework — Fostering',  'OFSTED_FSR',   'Ofsted')
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────
-- 3. Feature gates per solution type
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS solution_feature_gates (
  solution_type TEXT NOT NULL,
  feature_key TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  PRIMARY KEY (solution_type, feature_key)
);

INSERT INTO solution_feature_gates (solution_type, feature_key, enabled) VALUES
  ('domiciliary_care',       'medication_emar',       true),
  ('domiciliary_care',       'key_worker',            false),
  ('domiciliary_care',       'foster_reviews',        false),
  ('domiciliary_care',       'lac_reviews',           false),
  ('domiciliary_care',       'placement_matching',    false),
  ('domiciliary_care',       'nutrition_must',        true),
  ('supported_living',       'medication_emar',       true),
  ('supported_living',       'key_worker',            true),
  ('supported_living',       'foster_reviews',        false),
  ('supported_living',       'lac_reviews',           false),
  ('supported_living',       'nutrition_must',        true),
  ('childrens_residential',  'medication_emar',       true),
  ('childrens_residential',  'key_worker',            true),
  ('childrens_residential',  'foster_reviews',        false),
  ('childrens_residential',  'lac_reviews',           true),
  ('childrens_residential',  'placement_matching',    true),
  ('childrens_residential',  'education_liaison',     true),
  ('childrens_residential',  'physical_intervention', true),
  ('childrens_residential',  'nutrition_must',        true),
  ('fostering',              'medication_emar',       false),
  ('fostering',              'key_worker',            true),
  ('fostering',              'foster_reviews',        true),
  ('fostering',              'lac_reviews',           true),
  ('fostering',              'placement_matching',    true),
  ('fostering',              'nutrition_must',        false),
  ('nursing_home',           'medication_emar',       true),
  ('nursing_home',           'key_worker',            true),
  ('nursing_home',           'nutrition_must',        true),
  ('residential_care',       'medication_emar',       true),
  ('residential_care',       'key_worker',            true),
  ('residential_care',       'nutrition_must',        true)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────
-- 4. Staff documents library
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_category TEXT NOT NULL CHECK (document_category IN (
    'employment','compliance','identity_health','care_specific','policies_signed'
  )),
  document_key TEXT NOT NULL,
  document_label TEXT NOT NULL,
  file_url TEXT,
  file_name TEXT,
  issue_date DATE,
  expiry_date DATE,
  reminder_days INT[] DEFAULT ARRAY[60,30,14],
  is_mandatory BOOLEAN DEFAULT true,
  status TEXT NOT NULL DEFAULT 'not_uploaded' CHECK (status IN (
    'not_uploaded','uploaded','verified','expired','expiring_soon'
  )),
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (staff_id, document_key)
);

-- ─────────────────────────────────────────────
-- 5. Staff training matrix
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff_training (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  training_key TEXT NOT NULL,
  training_name TEXT NOT NULL,
  training_category TEXT NOT NULL CHECK (training_category IN (
    'mandatory_all','medication','dom_care','childrens','management'
  )),
  is_mandatory BOOLEAN DEFAULT true,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN (
    'not_started','in_progress','completed','overdue','renewal_due'
  )),
  completed_date DATE,
  expiry_date DATE,
  certificate_number TEXT,
  certificate_url TEXT,
  renewal_frequency_months INT DEFAULT 12,
  booked_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (staff_id, training_key)
);

-- ─────────────────────────────────────────────
-- 6. Supervision records
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff_supervision (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  supervisor_id UUID REFERENCES users(id),
  supervision_type TEXT NOT NULL DEFAULT 'one_to_one' CHECK (supervision_type IN (
    'one_to_one','group','spot_check','probationary','annual_appraisal'
  )),
  scheduled_date DATE,
  completed_date DATE,
  duration_minutes INT,
  notes TEXT,
  action_points JSONB DEFAULT '[]',
  staff_signature_at TIMESTAMPTZ,
  supervisor_signature_at TIMESTAMPTZ,
  next_due_date DATE,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN (
    'scheduled','completed','missed','cancelled'
  )),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────────
-- 7. Policy acknowledgements
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS policy_acknowledgements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  policy_key TEXT NOT NULL,
  policy_name TEXT NOT NULL,
  policy_version TEXT DEFAULT '1.0',
  policy_url TEXT,
  acknowledged_at TIMESTAMPTZ,
  is_new BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (staff_id, policy_key)
);

-- ─────────────────────────────────────────────
-- 8. Body map injuries (incident module)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS body_map_injuries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
  body_region TEXT NOT NULL,
  injury_type TEXT CHECK (injury_type IN (
    'bruise','laceration','burn','swelling','redness','pressure_sore','other'
  )),
  severity TEXT CHECK (severity IN ('minor','moderate','serious')),
  notes TEXT,
  x_percent NUMERIC,
  y_percent NUMERIC,
  surface TEXT CHECK (surface IN ('front','back')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────────
-- 9. Lone working check-ins / SOS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lone_working_check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID REFERENCES organisations(id),
  staff_id UUID REFERENCES users(id) ON DELETE CASCADE,
  check_in_at TIMESTAMPTZ DEFAULT now(),
  expected_finish_at TIMESTAMPTZ,
  checked_out_at TIMESTAMPTZ,
  location_lat NUMERIC,
  location_lng NUMERIC,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'active','checked_out','overdue','sos_triggered'
  )),
  alert_sent_at TIMESTAMPTZ,
  sos_triggered_at TIMESTAMPTZ,
  notes TEXT
);

-- ─────────────────────────────────────────────
-- 10. Foster / LAC reviews (childrens / fostering solution)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS foster_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  review_type TEXT NOT NULL CHECK (review_type IN (
    'annual_foster_review','lac_review','iro_meeting','panel','placement_review'
  )),
  scheduled_date DATE,
  completed_date DATE,
  outcome TEXT,
  panel_decision TEXT,
  attendees JSONB DEFAULT '[]',
  notes TEXT,
  next_review_date DATE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────────
-- 11. RLS policies
-- ─────────────────────────────────────────────
ALTER TABLE compliance_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE solution_feature_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_training ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_supervision ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_acknowledgements ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_map_injuries ENABLE ROW LEVEL SECURITY;
ALTER TABLE lone_working_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE foster_reviews ENABLE ROW LEVEL SECURITY;

-- Public reference tables
CREATE POLICY "public read compliance_frameworks" ON compliance_frameworks FOR SELECT USING (true);
CREATE POLICY "public read solution_feature_gates" ON solution_feature_gates FOR SELECT USING (true);

-- Org-scoped policies
CREATE POLICY "org staff_documents" ON staff_documents FOR ALL
  USING (organisation_id IN (SELECT organisation_id FROM users WHERE id = auth.uid()));

CREATE POLICY "org staff_training" ON staff_training FOR ALL
  USING (organisation_id IN (SELECT organisation_id FROM users WHERE id = auth.uid()));

CREATE POLICY "org staff_supervision" ON staff_supervision FOR ALL
  USING (organisation_id IN (SELECT organisation_id FROM users WHERE id = auth.uid()));

CREATE POLICY "policy_acks own or manager" ON policy_acknowledgements FOR ALL
  USING (
    staff_id = auth.uid()
    OR organisation_id IN (
      SELECT organisation_id FROM users WHERE id = auth.uid() AND role IN ('org_admin','manager')
    )
  );

CREATE POLICY "org body_map" ON body_map_injuries FOR ALL
  USING (organisation_id IN (SELECT organisation_id FROM users WHERE id = auth.uid()));

CREATE POLICY "lone_working own or manager" ON lone_working_check_ins FOR ALL
  USING (
    staff_id = auth.uid()
    OR organisation_id IN (
      SELECT organisation_id FROM users WHERE id = auth.uid() AND role IN ('org_admin','manager','coordinator')
    )
  );

CREATE POLICY "org foster_reviews" ON foster_reviews FOR ALL
  USING (organisation_id IN (SELECT organisation_id FROM users WHERE id = auth.uid()));
