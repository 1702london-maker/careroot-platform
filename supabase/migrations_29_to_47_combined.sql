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
-- Migration 30: Service Lines
-- Three regulated service lines sharing one platform

CREATE TABLE IF NOT EXISTS service_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  regulatory_body text,
  compliance_framework text,
  is_active boolean DEFAULT true
);

INSERT INTO service_lines (code, name, regulatory_body, compliance_framework)
VALUES
  ('DOM_CARE', 'Domiciliary Care', 'CQC', 'CQC Single Assessment Framework'),
  ('SUPPORT_OUTREACH', 'Support Outreach 14-17', 'LOCAL_AUTHORITY', 'Working Together to Safeguard Children 2023'),
  ('OFSTED_CHILDREN', 'Children Regulated Services', 'OFSTED', 'Ofsted Social Care Common Inspection Framework')
ON CONFLICT (code) DO NOTHING;

ALTER TABLE service_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_lines_read ON service_lines FOR SELECT USING (true);
-- Migration 31: Compliance Packs, Standards, Rules

CREATE TABLE IF NOT EXISTS compliance_packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_line_id uuid REFERENCES service_lines(id),
  name text NOT NULL,
  version text NOT NULL,
  effective_date date NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS compliance_standards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id uuid REFERENCES compliance_packs(id),
  code text NOT NULL,
  name text NOT NULL,
  description text,
  display_order integer
);

CREATE TABLE IF NOT EXISTS compliance_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  standard_id uuid REFERENCES compliance_standards(id),
  code text NOT NULL,
  name text NOT NULL,
  description text,
  rule_type text NOT NULL,
  -- 'document_required' | 'expiry_check' | 'training_required'
  -- | 'log_frequency' | 'medication_check' | 'safeguarding_process'
  is_mandatory boolean DEFAULT true,
  applies_to text,
  -- 'staff' | 'client' | 'organisation' | 'shift'
  applies_to_role text[]
);

ALTER TABLE compliance_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY compliance_packs_read ON compliance_packs FOR SELECT USING (true);
CREATE POLICY compliance_standards_read ON compliance_standards FOR SELECT USING (true);
CREATE POLICY compliance_rules_read ON compliance_rules FOR SELECT USING (true);

-- Seed CQC pack
INSERT INTO compliance_packs (service_line_id, name, version, effective_date)
SELECT id, 'CQC Single Assessment Framework', '2023', '2023-11-01'
FROM service_lines WHERE code = 'DOM_CARE'
ON CONFLICT DO NOTHING;

-- Seed CQC standards
INSERT INTO compliance_standards (pack_id, code, name, display_order)
SELECT cp.id, s.code, s.name, s.display_order
FROM compliance_packs cp,
(VALUES
  ('SAFE', 'Safe', 1),
  ('EFFECTIVE', 'Effective', 2),
  ('CARING', 'Caring', 3),
  ('RESPONSIVE', 'Responsive', 4),
  ('WELL_LED', 'Well-Led', 5)
) AS s(code, name, display_order)
WHERE cp.name = 'CQC Single Assessment Framework'
ON CONFLICT DO NOTHING;
-- Migration 32: Shift Credentials
-- Time-limited PIN + token sent via SMS before each shift

CREATE TABLE IF NOT EXISTS shift_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES users(id),
  shift_id uuid, -- FK added in migration 033 once shifts table exists
  pin_hash text NOT NULL,
  token text UNIQUE NOT NULL,
  valid_from timestamptz NOT NULL,
  valid_until timestamptz NOT NULL,
  -- valid_until = shift_end + 30 minutes grace period
  delivered_at timestamptz,
  delivery_method text DEFAULT 'sms',
  used_at timestamptz,
  invalidated_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shift_credentials_staff ON shift_credentials(staff_id);
CREATE INDEX IF NOT EXISTS idx_shift_credentials_token ON shift_credentials(token);
CREATE INDEX IF NOT EXISTS idx_shift_credentials_valid_until ON shift_credentials(valid_until);

ALTER TABLE shift_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY shift_credentials_staff_own ON shift_credentials
  FOR SELECT USING (staff_id = auth.uid());

CREATE POLICY shift_credentials_manager_all ON shift_credentials
  FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid()) IN ('superadmin', 'org_admin', 'manager', 'coordinator')
  );
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
  ADD CONSTRAINT IF NOT EXISTS fk_shift_credentials_shift
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
-- Migration 36: Extend care_plans + add notification and contribution tables
-- care_plans table already exists (migration 005); adding new columns only

ALTER TABLE care_plans
  ADD COLUMN IF NOT EXISTS effective_from date,
  ADD COLUMN IF NOT EXISTS effective_to date,
  ADD COLUMN IF NOT EXISTS is_current boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS authorised_tasks jsonb,
  -- exact list of tasks worker is permitted to perform
  -- e.g. ["personal_care","medication","meal_prep","mobility_support","companionship"]
  ADD COLUMN IF NOT EXISTS excluded_tasks jsonb,
  -- e.g. ["heavy_lifting","car_washing","house_cleaning_beyond_scope","errands"]
  ADD COLUMN IF NOT EXISTS mood_vocabulary jsonb,
  -- client-specific terms agreed with placing authority
  ADD COLUMN IF NOT EXISTS trigger_vocabulary jsonb,
  -- specific words/phrases that flag for review
  ADD COLUMN IF NOT EXISTS mood_baseline jsonb;
  -- populated after 4 weeks of data

CREATE INDEX IF NOT EXISTS idx_care_plans_current ON care_plans(is_current);

-- Care plan read confirmations before shift start
CREATE TABLE IF NOT EXISTS care_plan_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  care_plan_id uuid REFERENCES care_plans(id),
  client_id uuid REFERENCES clients(id),
  staff_id uuid REFERENCES users(id),
  notification_sent_at timestamptz DEFAULT now(),
  read_confirmed_at timestamptz,
  confirmed_before_shift_id uuid REFERENCES shifts(id)
);

-- Worker contributions to care plan (reviewed by manager)
CREATE TABLE IF NOT EXISTS care_plan_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id),
  submitted_by uuid REFERENCES users(id),
  content text NOT NULL,
  submitted_at timestamptz DEFAULT now(),
  reviewed_by uuid REFERENCES users(id),
  reviewed_at timestamptz,
  status text DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  manager_notes text
);

ALTER TABLE care_plan_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_plan_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY care_plan_notifications_org ON care_plan_notifications
  FOR ALL USING (
    staff_id IN (SELECT id FROM users WHERE organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid()))
  );

CREATE POLICY care_plan_contributions_org ON care_plan_contributions
  FOR ALL USING (
    submitted_by IN (SELECT id FROM users WHERE organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid()))
  );
-- Migration 37: Shift Logs
-- Immutable care records created during shift. Server timestamp only.
-- Trigger word detection, voice transcription, GPS verification.

CREATE TABLE IF NOT EXISTS shift_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id uuid REFERENCES shifts(id),
  client_id uuid REFERENCES clients(id),
  staff_id uuid REFERENCES users(id),
  log_type text NOT NULL,
  -- 'hourly' | 'task_completion' | 'medication' | 'nutrition'
  -- | 'mood' | 'behaviour' | 'handover' | 'role_boundary'
  -- | 'verbal_abuse' | 'general'
  content text,
  voice_recording_url text,
  transcription text,
  structured_data jsonb,
  gps_lat decimal,
  gps_lng decimal,
  within_approved_radius boolean,
  server_timestamp timestamptz DEFAULT now(), -- IMMUTABLE — never trust device timestamp
  device_imei text,
  triggers_detected jsonb,
  trigger_reviewed_by uuid REFERENCES users(id),
  trigger_reviewed_at timestamptz,
  edited boolean DEFAULT false,
  edit_history jsonb -- original text preserved on every edit
);

CREATE INDEX IF NOT EXISTS idx_shift_logs_shift ON shift_logs(shift_id);
CREATE INDEX IF NOT EXISTS idx_shift_logs_client ON shift_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_shift_logs_timestamp ON shift_logs(server_timestamp);
CREATE INDEX IF NOT EXISTS idx_shift_logs_type ON shift_logs(log_type);

ALTER TABLE shift_logs ENABLE ROW LEVEL SECURITY;

-- Incoming workers cannot query shift_logs directly — only handover_notes
CREATE POLICY shift_logs_manager ON shift_logs
  FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid()) IN ('superadmin', 'org_admin', 'manager', 'coordinator')
    AND staff_id IN (SELECT id FROM users WHERE organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid()))
  );

-- Staff can only see their own shift logs
CREATE POLICY shift_logs_own_shift ON shift_logs
  FOR ALL USING (staff_id = auth.uid());
-- Migration 38: Task Completions and Role Boundary Protection

-- Every task performed during a shift, validated against care plan
CREATE TABLE IF NOT EXISTS task_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id uuid REFERENCES shifts(id),
  client_id uuid REFERENCES clients(id),
  staff_id uuid REFERENCES users(id),
  task_name text NOT NULL, -- must match authorised_tasks in care plan
  is_authorised boolean NOT NULL, -- false = outside care plan = immediate flag
  completed_at timestamptz DEFAULT now(),
  server_timestamp timestamptz DEFAULT now(),
  gps_lat decimal,
  gps_lng decimal,
  notes text,
  flagged_as_role_violation boolean DEFAULT false
);

-- Worker asked to do something outside their care plan
CREATE TABLE IF NOT EXISTS role_boundary_violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id uuid REFERENCES shifts(id),
  client_id uuid REFERENCES clients(id),
  staff_id uuid REFERENCES users(id),
  requested_task text NOT NULL,
  requested_by text NOT NULL, -- 'client' | 'family_member' | 'other'
  worker_response text NOT NULL, -- 'complied' | 'refused'
  compliance_note text,
  server_timestamp timestamptz DEFAULT now(),
  notified_manager_id uuid REFERENCES users(id),
  notified_hr_lead_id uuid REFERENCES users(id),
  notified_compliance_lead_id uuid REFERENCES users(id),
  notification_sent_at timestamptz
);

-- Verbal abuse experienced by worker during shift
CREATE TABLE IF NOT EXISTS verbal_abuse_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id uuid REFERENCES shifts(id),
  client_id uuid REFERENCES clients(id),
  staff_id uuid REFERENCES users(id),
  perpetrator text NOT NULL, -- 'client' | 'family_member' | 'other'
  description text NOT NULL,
  server_timestamp timestamptz DEFAULT now(),
  gps_lat decimal,
  gps_lng decimal,
  notified_manager_id uuid REFERENCES users(id),
  notified_hr_lead_id uuid REFERENCES users(id),
  notified_compliance_lead_id uuid REFERENCES users(id),
  notification_sent_at timestamptz,
  action_taken text,
  resolved boolean DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_task_completions_shift ON task_completions(shift_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_client ON task_completions(client_id);
CREATE INDEX IF NOT EXISTS idx_role_boundary_violations_shift ON role_boundary_violations(shift_id);
CREATE INDEX IF NOT EXISTS idx_verbal_abuse_shift ON verbal_abuse_reports(shift_id);

ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_boundary_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE verbal_abuse_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY task_completions_org ON task_completions
  FOR ALL USING (
    staff_id IN (SELECT id FROM users WHERE organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid()))
  );

CREATE POLICY role_boundary_org ON role_boundary_violations
  FOR ALL USING (
    staff_id IN (SELECT id FROM users WHERE organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid()))
  );

CREATE POLICY verbal_abuse_org ON verbal_abuse_reports
  FOR ALL USING (
    staff_id IN (SELECT id FROM users WHERE organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid()))
  );
-- Migration 39: Medication Management
-- medication_schedules is new. medication_records already exists (migration 010)
-- so we extend it; medication_schedules is the new controlled schedule table.

CREATE TABLE IF NOT EXISTS medication_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id),
  medication_name text NOT NULL,
  dose text NOT NULL,
  route text NOT NULL, -- 'oral' | 'topical' | 'inhaled' | 'injection'
  scheduled_times time[] NOT NULL,
  is_prn boolean DEFAULT false,
  is_controlled boolean DEFAULT false,
  prescriber text,
  start_date date NOT NULL,
  end_date date,
  current_stock integer,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_medication_schedules_client ON medication_schedules(client_id);
CREATE INDEX IF NOT EXISTS idx_medication_schedules_active ON medication_schedules(is_active);

ALTER TABLE medication_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY medication_schedules_org ON medication_schedules
  FOR ALL USING (
    client_id IN (SELECT id FROM clients WHERE organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid()))
  );

-- Extend existing medication_records table with shift-level and alert fields
-- (migration 010 created the base table)
ALTER TABLE medication_records
  ADD COLUMN IF NOT EXISTS medication_schedule_id uuid REFERENCES medication_schedules(id),
  ADD COLUMN IF NOT EXISTS shift_id uuid REFERENCES shifts(id),
  ADD COLUMN IF NOT EXISTS scheduled_time timestamptz,
  ADD COLUMN IF NOT EXISTS administered_at timestamptz,
  ADD COLUMN IF NOT EXISTS server_timestamp timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS stock_before integer,
  ADD COLUMN IF NOT EXISTS stock_after integer,
  ADD COLUMN IF NOT EXISTS prn_reason text,
  ADD COLUMN IF NOT EXISTS refusal_reason text,
  ADD COLUMN IF NOT EXISTS outcome_notes text,
  -- CONTROLLED DRUGS
  ADD COLUMN IF NOT EXISTS witness_staff_id uuid REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS witness_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS manager_remote_auth_id uuid REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS manager_remote_auth_image_url text,
  ADD COLUMN IF NOT EXISTS manager_remote_auth_at timestamptz,
  -- ALERTS — fires 15 minutes after scheduled time if not logged
  ADD COLUMN IF NOT EXISTS alert_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS alert_acknowledged_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_medication_records_shift ON medication_records(shift_id);
CREATE INDEX IF NOT EXISTS idx_medication_records_scheduled ON medication_records(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_medication_records_schedule ON medication_records(medication_schedule_id);
-- Migration 40: Nutrition Records and Mood Tracking
-- shift-level granular records (existing meal_records/nutrition_profiles are plan-level)

CREATE TABLE IF NOT EXISTS nutrition_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id uuid REFERENCES shifts(id),
  client_id uuid REFERENCES clients(id),
  staff_id uuid REFERENCES users(id),
  meal_type text NOT NULL,
  -- 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'fluids'
  offered text,
  consumed text,
  -- 'all' | 'most' | 'half' | 'little' | 'none'
  concerns text,
  fluid_intake_ml integer,
  server_timestamp timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mood_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id uuid REFERENCES shifts(id),
  client_id uuid REFERENCES clients(id),
  staff_id uuid REFERENCES users(id),
  mood_term text NOT NULL, -- must come from care_plan.mood_vocabulary
  mood_category text,
  -- 'positive' | 'neutral' | 'concerning' | 'critical'
  context_notes text,
  triggers_activated boolean DEFAULT false,
  server_timestamp timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nutrition_records_client ON nutrition_records(client_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_records_shift ON nutrition_records(shift_id);
CREATE INDEX IF NOT EXISTS idx_mood_records_client ON mood_records(client_id);
CREATE INDEX IF NOT EXISTS idx_mood_records_timestamp ON mood_records(server_timestamp);

ALTER TABLE nutrition_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY nutrition_records_org ON nutrition_records
  FOR ALL USING (
    client_id IN (SELECT id FROM clients WHERE organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid()))
  );

CREATE POLICY mood_records_org ON mood_records
  FOR ALL USING (
    client_id IN (SELECT id FROM clients WHERE organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid()))
  );
-- Migration 41: Extend incidents table with ABC framework fields
-- incidents table already exists (migration 011); adding new columns only

ALTER TABLE incidents
  ADD COLUMN IF NOT EXISTS shift_id uuid REFERENCES shifts(id),
  ADD COLUMN IF NOT EXISTS service_line_id uuid REFERENCES service_lines(id),
  ADD COLUMN IF NOT EXISTS incident_type text,
  -- 'behavioural' | 'medical' | 'environmental' | 'safeguarding' | 'physical_intervention'

  -- ANTECEDENT (ABC framework)
  ADD COLUMN IF NOT EXISTS antecedent text,
  ADD COLUMN IF NOT EXISTS antecedent_environment text,
  ADD COLUMN IF NOT EXISTS antecedent_trigger text,

  -- BEHAVIOUR
  ADD COLUMN IF NOT EXISTS behaviour_description text,
  ADD COLUMN IF NOT EXISTS behaviour_specific text,
  -- exact description required, never just "aggressive"

  -- CONSEQUENCE
  ADD COLUMN IF NOT EXISTS consequence_description text,
  ADD COLUMN IF NOT EXISTS consequence_outcome text,

  -- PHYSICAL INTERVENTION (PMVA aligned — always visible, conditional mandatory)
  ADD COLUMN IF NOT EXISTS physical_intervention_occurred boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS pi_technique text,
  ADD COLUMN IF NOT EXISTS pi_duration_minutes integer,
  ADD COLUMN IF NOT EXISTS pi_authorised_by uuid REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS pi_debrief_scheduled boolean,
  ADD COLUMN IF NOT EXISTS pi_debrief_date date,

  -- DE-ESCALATION (PMVA aligned)
  ADD COLUMN IF NOT EXISTS deescalation_strategies_used text[],
  ADD COLUMN IF NOT EXISTS deescalation_sequence text,

  -- POST-INCIDENT STAFF WELLBEING
  ADD COLUMN IF NOT EXISTS staff_wellbeing_checked boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS staff_wellbeing_check_due timestamptz,
  -- auto-set to 24 hours after incident

  -- EVIDENCE AND NOTIFICATIONS
  ADD COLUMN IF NOT EXISTS gps_lat decimal,
  ADD COLUMN IF NOT EXISTS gps_lng decimal,
  ADD COLUMN IF NOT EXISTS photo_evidence_urls text[],
  ADD COLUMN IF NOT EXISTS notified_manager_at timestamptz,
  ADD COLUMN IF NOT EXISTS notified_safeguarding_lead_at timestamptz,
  -- BOTH simultaneously regardless of time
  ADD COLUMN IF NOT EXISTS notified_placing_authority_at timestamptz,
  ADD COLUMN IF NOT EXISTS server_timestamp timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_incidents_shift ON incidents(shift_id);
CREATE INDEX IF NOT EXISTS idx_incidents_timestamp ON incidents(server_timestamp);
CREATE INDEX IF NOT EXISTS idx_incidents_physical_intervention ON incidents(physical_intervention_occurred);
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
-- Migration 43: Handover Notes
-- Synthesised from shift data — raw shift_logs NEVER accessible to incoming worker
-- Outgoing worker must sign off before handover publishes
-- Incoming worker must confirm read before shift access fully opens

CREATE TABLE IF NOT EXISTS handover_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id uuid REFERENCES shifts(id),
  client_id uuid REFERENCES clients(id),
  outgoing_staff_id uuid REFERENCES users(id),
  incoming_staff_id uuid REFERENCES users(id),

  -- SYNTHESISED CONTENT
  -- Generated by system from shift structured data
  -- Raw logs NEVER included or visible to incoming worker
  current_status text NOT NULL,
  key_events text,
  nutrition_summary text,
  medication_summary text,
  actions_for_incoming_worker text,
  triggers_activated_this_shift text,

  -- OUTGOING WORKER DIGITAL SIGN-OFF
  -- Required before handover publishes to incoming worker
  outgoing_approved_at timestamptz,

  -- INCOMING WORKER CONFIRMATION
  -- Required before shift access fully opens
  incoming_read_confirmed_at timestamptz,

  server_timestamp timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_handover_notes_shift ON handover_notes(shift_id);
CREATE INDEX IF NOT EXISTS idx_handover_notes_client ON handover_notes(client_id);
CREATE INDEX IF NOT EXISTS idx_handover_notes_incoming ON handover_notes(incoming_staff_id);

ALTER TABLE handover_notes ENABLE ROW LEVEL SECURITY;

-- Outgoing worker can see and approve their own handovers
CREATE POLICY handover_outgoing ON handover_notes
  FOR ALL USING (outgoing_staff_id = auth.uid());

-- Incoming worker can see (but not edit) handovers addressed to them
-- only once outgoing has approved
CREATE POLICY handover_incoming ON handover_notes
  FOR SELECT USING (
    incoming_staff_id = auth.uid()
    AND outgoing_approved_at IS NOT NULL
  );

-- Managers see all handovers in their org
CREATE POLICY handover_manager ON handover_notes
  FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid()) IN ('superadmin', 'org_admin', 'manager', 'coordinator')
    AND outgoing_staff_id IN (SELECT id FROM users WHERE organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid()))
  );
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
-- Migration 46: Shift Financial Records and Commissioner Invoices

-- Financial record per shift: hours, travel, mileage
CREATE TABLE IF NOT EXISTS shift_financial_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id uuid REFERENCES shifts(id),
  client_id uuid REFERENCES clients(id),
  staff_id uuid REFERENCES users(id),
  commissioned_hours decimal NOT NULL,
  actual_hours decimal, -- derived from actual_start and actual_end
  travel_time_minutes integer,
  mileage_claimed_miles decimal,
  mileage_claimed_at timestamptz,
  invoice_id uuid, -- FK to commissioner_invoices added below
  billable_amount decimal,
  created_at timestamptz DEFAULT now()
);

-- Commissioner invoices: aggregate of shift financial records per period
CREATE TABLE IF NOT EXISTS commissioner_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES organisations(id),
  client_id uuid REFERENCES clients(id),
  service_line_id uuid REFERENCES service_lines(id),
  period_start date NOT NULL,
  period_end date NOT NULL,
  shift_ids uuid[],
  total_hours decimal NOT NULL,
  rate_per_hour decimal NOT NULL,
  total_amount decimal NOT NULL,
  evidence_pack_url text,
  status text DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'paid', 'disputed')),
  sent_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Add FK from shift_financial_records to commissioner_invoices now that it exists
ALTER TABLE shift_financial_records
  ADD CONSTRAINT IF NOT EXISTS fk_sfr_invoice
  FOREIGN KEY (invoice_id) REFERENCES commissioner_invoices(id);

CREATE INDEX IF NOT EXISTS idx_shift_financial_shift ON shift_financial_records(shift_id);
CREATE INDEX IF NOT EXISTS idx_shift_financial_staff ON shift_financial_records(staff_id);
CREATE INDEX IF NOT EXISTS idx_commissioner_invoices_client ON commissioner_invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_commissioner_invoices_status ON commissioner_invoices(status);
CREATE INDEX IF NOT EXISTS idx_commissioner_invoices_org ON commissioner_invoices(organisation_id);

ALTER TABLE shift_financial_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissioner_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY shift_financial_org ON shift_financial_records
  FOR ALL USING (
    staff_id IN (SELECT id FROM users WHERE organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid()))
  );

CREATE POLICY commissioner_invoices_org ON commissioner_invoices
  FOR ALL USING (
    organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
  );
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
