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
