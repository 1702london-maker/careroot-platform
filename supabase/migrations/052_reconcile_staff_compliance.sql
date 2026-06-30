-- Reconcile staff_compliance with the application.
-- Live table (migration 044) has no `notes` column, but the staff-compliance
-- route (POST + PATCH), /staff/compliance page, and StaffComplianceDashboard
-- all read/write it. Add it. Additive and idempotent.

ALTER TABLE staff_compliance
  ADD COLUMN IF NOT EXISTS notes text;
