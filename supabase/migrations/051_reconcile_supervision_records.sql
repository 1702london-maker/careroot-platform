-- Reconcile supervision_records with what the application uses.
-- Live table (migration 044) has notes/actions/staff_signed_at, but the
-- supervisions route, page, and SupervisionsDashboard use topics_discussed,
-- action_points, and staff_signature_obtained. Add the app columns + backfill.
-- Additive and idempotent.

ALTER TABLE supervision_records
  ADD COLUMN IF NOT EXISTS topics_discussed text,
  ADD COLUMN IF NOT EXISTS action_points text,
  ADD COLUMN IF NOT EXISTS staff_signature_obtained boolean DEFAULT false;

-- Backfill from the original spec columns where present.
UPDATE supervision_records
SET topics_discussed = COALESCE(topics_discussed, notes),
    action_points = COALESCE(action_points, actions::text),
    staff_signature_obtained = COALESCE(staff_signature_obtained, staff_signed_at IS NOT NULL)
WHERE topics_discussed IS NULL OR action_points IS NULL;
