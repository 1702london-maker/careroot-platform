-- Reconcile consent_records with what the application actually uses.
-- The live table (from migration 047) has consented_by/consented_at, but the
-- consent route, /consent page, and ConsentDashboard all read/write a richer
-- set: granted (bool), granted_by, granted_at, withdrawn_at, notes, review_due.
-- Add the app columns so the feature works. Additive and idempotent.

ALTER TABLE consent_records
  ADD COLUMN IF NOT EXISTS granted boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS granted_by text,
  ADD COLUMN IF NOT EXISTS granted_at timestamptz,
  ADD COLUMN IF NOT EXISTS withdrawn_at timestamptz,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS review_due date;

-- Backfill app columns from the original spec columns where present, so any
-- rows created before this migration still display correctly.
UPDATE consent_records
SET granted = COALESCE(granted, true),
    granted_by = COALESCE(granted_by, consented_by),
    granted_at = COALESCE(granted_at, consented_at),
    withdrawn_at = COALESCE(withdrawn_at, consent_withdrawn_at)
WHERE granted_by IS NULL OR granted_at IS NULL;
