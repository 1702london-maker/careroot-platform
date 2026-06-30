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
