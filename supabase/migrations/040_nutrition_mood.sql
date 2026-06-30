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
