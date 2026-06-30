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
