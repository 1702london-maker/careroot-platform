-- Migration 59: Medication workflow completion
-- Adds controlled-drug authorisation evidence and stock discrepancy tracking.

ALTER TABLE public.medication_records
  ADD COLUMN IF NOT EXISTS authorisation_method TEXT,
  ADD COLUMN IF NOT EXISTS witness_name TEXT,
  ADD COLUMN IF NOT EXISTS manager_remote_auth_name TEXT,
  ADD COLUMN IF NOT EXISTS stock_discrepancy_detected BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stock_discrepancy_amount INTEGER,
  ADD COLUMN IF NOT EXISTS stock_discrepancy_note TEXT;

ALTER TABLE public.medication_records
  DROP CONSTRAINT IF EXISTS medication_records_authorisation_method_check;

ALTER TABLE public.medication_records
  ADD CONSTRAINT medication_records_authorisation_method_check
  CHECK (
    authorisation_method IS NULL OR
    authorisation_method IN ('second_staff_witness', 'remote_manager_authorisation')
  );

ALTER TABLE public.medication_records
  DROP CONSTRAINT IF EXISTS medication_records_status_check;

ALTER TABLE public.medication_records
  ADD CONSTRAINT medication_records_status_check
  CHECK (
    status IN (
      'given',
      'administered',
      'refused',
      'unavailable',
      'not_required',
      'omitted',
      'missed',
      'deferred'
    )
  );

CREATE INDEX IF NOT EXISTS idx_medication_records_controlled_discrepancy
  ON public.medication_records(stock_discrepancy_detected)
  WHERE stock_discrepancy_detected = true;
