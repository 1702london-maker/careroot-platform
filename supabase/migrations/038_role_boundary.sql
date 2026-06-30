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
