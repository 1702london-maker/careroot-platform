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
