-- Migration 44: Staff Wellbeing Checks, Compliance Records, Supervision

-- Wellbeing check at shift start, shift end, and after physical intervention incidents
CREATE TABLE IF NOT EXISTS staff_wellbeing_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES users(id),
  shift_id uuid REFERENCES shifts(id),
  check_type text NOT NULL,
  -- 'shift_start' | 'shift_end' | 'post_incident'
  wellbeing_status text NOT NULL,
  -- 'good' | 'tired' | 'stressed' | 'distressed' | 'unwell'
  notes text,
  flagged_for_manager boolean DEFAULT false,
  server_timestamp timestamptz DEFAULT now(),
  manager_acknowledged_at timestamptz
);

-- Compliance tracking: DBS, training, supervision, right-to-work, etc.
CREATE TABLE IF NOT EXISTS staff_compliance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES users(id),
  compliance_item text NOT NULL,
  -- 'dbs' | 'mandatory_training' | 'supervision' | 'appraisal'
  -- | 'reference' | 'right_to_work' | 'pmva_training' | 'oliver_mcgowan_training'
  status text NOT NULL,
  -- 'current' | 'expiring_soon' | 'expired' | 'missing'
  valid_from date,
  valid_until date,
  document_url text,
  verified_by uuid REFERENCES users(id),
  verified_at timestamptz,
  alert_sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Formal and informal supervision records
CREATE TABLE IF NOT EXISTS supervision_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES users(id),
  supervisor_id uuid REFERENCES users(id),
  supervision_date date NOT NULL,
  supervision_type text NOT NULL,
  -- 'formal' | 'informal' | 'group'
  notes text NOT NULL,
  actions jsonb,
  staff_signed_at timestamptz,
  supervisor_signed_at timestamptz,
  next_supervision_due date,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_wellbeing_staff ON staff_wellbeing_checks(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_wellbeing_shift ON staff_wellbeing_checks(shift_id);
CREATE INDEX IF NOT EXISTS idx_staff_compliance_staff ON staff_compliance(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_compliance_status ON staff_compliance(status);
CREATE INDEX IF NOT EXISTS idx_staff_compliance_expiry ON staff_compliance(valid_until);
CREATE INDEX IF NOT EXISTS idx_supervision_staff ON supervision_records(staff_id);

ALTER TABLE staff_wellbeing_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_compliance ENABLE ROW LEVEL SECURITY;
ALTER TABLE supervision_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY wellbeing_own ON staff_wellbeing_checks
  FOR ALL USING (staff_id = auth.uid());

CREATE POLICY wellbeing_manager ON staff_wellbeing_checks
  FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid()) IN ('superadmin', 'org_admin', 'manager', 'coordinator')
    AND staff_id IN (SELECT id FROM users WHERE organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid()))
  );

CREATE POLICY compliance_manager ON staff_compliance
  FOR ALL USING (
    staff_id IN (SELECT id FROM users WHERE organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid()))
  );

CREATE POLICY supervision_org ON supervision_records
  FOR ALL USING (
    staff_id IN (SELECT id FROM users WHERE organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid()))
  );
