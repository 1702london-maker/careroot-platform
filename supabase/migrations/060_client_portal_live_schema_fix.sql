-- Migration 60: live client/family portal schema repair
-- Safe to run repeatedly from the Supabase SQL editor.

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('superadmin','org_admin','manager','coordinator','carer','family','client','gp'));

CREATE TABLE IF NOT EXISTS public.client_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  organisation_id UUID NOT NULL REFERENCES public.organisations(id),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  access_level TEXT NOT NULL DEFAULT 'full' CHECK (access_level IN ('limited','standard','full')),
  invited_by UUID REFERENCES public.users(id),
  invite_accepted_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (client_id, user_id)
);

ALTER TABLE public.family_access
  ADD COLUMN IF NOT EXISTS is_primary_contact BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS emergency_contact BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_view_care_plan BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS can_view_medications BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS can_view_visit_notes BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS can_view_incidents BOOLEAN DEFAULT true;

ALTER TABLE public.consent_records
  ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES public.organisations(id);

UPDATE public.consent_records cr
SET organisation_id = c.organisation_id
FROM public.clients c
WHERE cr.client_id = c.id
  AND cr.organisation_id IS NULL;

ALTER TABLE public.client_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS client_access_self_select ON public.client_access;
DROP POLICY IF EXISTS client_access_office_org ON public.client_access;
DROP POLICY IF EXISTS clients_select_client_access ON public.clients;
DROP POLICY IF EXISTS visits_select_client_access ON public.visits;
DROP POLICY IF EXISTS care_plans_select_client_access ON public.care_plans;
DROP POLICY IF EXISTS medication_schedules_select_client_access ON public.medication_schedules;
DROP POLICY IF EXISTS medication_records_select_client_access ON public.medication_records;
DROP POLICY IF EXISTS nutrition_records_select_client_access ON public.nutrition_records;
DROP POLICY IF EXISTS mood_records_select_client_access ON public.mood_records;
DROP POLICY IF EXISTS consent_records_select_client_access ON public.consent_records;
DROP POLICY IF EXISTS sar_requests_select_client_access ON public.sar_requests;
DROP POLICY IF EXISTS complaints_select_client_access ON public.complaints;
DROP POLICY IF EXISTS visits_select_family_access ON public.visits;
DROP POLICY IF EXISTS care_plans_select_family_access ON public.care_plans;
DROP POLICY IF EXISTS medication_schedules_select_family_access ON public.medication_schedules;
DROP POLICY IF EXISTS medication_records_select_family_access ON public.medication_records;
DROP POLICY IF EXISTS nutrition_records_select_family_access ON public.nutrition_records;
DROP POLICY IF EXISTS mood_records_select_family_access ON public.mood_records;
DROP POLICY IF EXISTS consent_records_select_family_access ON public.consent_records;
DROP POLICY IF EXISTS sar_requests_select_family_access ON public.sar_requests;
DROP POLICY IF EXISTS family_briefings_select_family_access ON public.family_briefings;

CREATE POLICY client_access_self_select ON public.client_access
  FOR SELECT USING (user_id = auth.uid() AND is_active = true);

CREATE POLICY client_access_office_org ON public.client_access
  FOR ALL USING (
    organisation_id = (SELECT organisation_id FROM public.users WHERE id = auth.uid())
    AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('superadmin','org_admin','manager','coordinator')
  )
  WITH CHECK (
    organisation_id = (SELECT organisation_id FROM public.users WHERE id = auth.uid())
    AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('superadmin','org_admin','manager','coordinator')
  );

CREATE POLICY clients_select_client_access ON public.clients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.client_access ca
      WHERE ca.client_id = clients.id
        AND ca.user_id = auth.uid()
        AND ca.is_active = true
    )
  );

CREATE POLICY visits_select_client_access ON public.visits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.client_access ca
      WHERE ca.client_id = visits.client_id
        AND ca.user_id = auth.uid()
        AND ca.is_active = true
    )
  );

CREATE POLICY care_plans_select_client_access ON public.care_plans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.client_access ca
      WHERE ca.client_id = care_plans.client_id
        AND ca.user_id = auth.uid()
        AND ca.is_active = true
    )
  );

CREATE POLICY medication_schedules_select_client_access ON public.medication_schedules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.client_access ca
      WHERE ca.client_id = medication_schedules.client_id
        AND ca.user_id = auth.uid()
        AND ca.is_active = true
    )
  );

CREATE POLICY medication_records_select_client_access ON public.medication_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.client_access ca
      WHERE ca.client_id = medication_records.client_id
        AND ca.user_id = auth.uid()
        AND ca.is_active = true
    )
  );

CREATE POLICY nutrition_records_select_client_access ON public.nutrition_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.client_access ca
      WHERE ca.client_id = nutrition_records.client_id
        AND ca.user_id = auth.uid()
        AND ca.is_active = true
    )
  );

CREATE POLICY mood_records_select_client_access ON public.mood_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.client_access ca
      WHERE ca.client_id = mood_records.client_id
        AND ca.user_id = auth.uid()
        AND ca.is_active = true
    )
  );

CREATE POLICY consent_records_select_client_access ON public.consent_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.client_access ca
      WHERE ca.client_id = consent_records.client_id
        AND ca.user_id = auth.uid()
        AND ca.is_active = true
    )
  );

CREATE POLICY sar_requests_select_client_access ON public.sar_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.client_access ca
      WHERE ca.client_id = sar_requests.client_id
        AND ca.user_id = auth.uid()
        AND ca.is_active = true
    )
  );

CREATE POLICY complaints_select_client_access ON public.complaints
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.client_access ca
      WHERE ca.client_id = complaints.client_id
        AND ca.user_id = auth.uid()
        AND ca.is_active = true
    )
  );

CREATE POLICY visits_select_family_access ON public.visits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.family_access fa
      WHERE fa.client_id = visits.client_id
        AND fa.user_id = auth.uid()
        AND fa.is_active = true
    )
  );

CREATE POLICY care_plans_select_family_access ON public.care_plans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.family_access fa
      WHERE fa.client_id = care_plans.client_id
        AND fa.user_id = auth.uid()
        AND fa.is_active = true
        AND fa.access_level IN ('standard','full')
    )
  );

CREATE POLICY medication_schedules_select_family_access ON public.medication_schedules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.family_access fa
      WHERE fa.client_id = medication_schedules.client_id
        AND fa.user_id = auth.uid()
        AND fa.is_active = true
        AND fa.access_level IN ('standard','full')
    )
  );

CREATE POLICY medication_records_select_family_access ON public.medication_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.family_access fa
      WHERE fa.client_id = medication_records.client_id
        AND fa.user_id = auth.uid()
        AND fa.is_active = true
        AND fa.access_level IN ('standard','full')
    )
  );

CREATE POLICY nutrition_records_select_family_access ON public.nutrition_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.family_access fa
      WHERE fa.client_id = nutrition_records.client_id
        AND fa.user_id = auth.uid()
        AND fa.is_active = true
    )
  );

CREATE POLICY mood_records_select_family_access ON public.mood_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.family_access fa
      WHERE fa.client_id = mood_records.client_id
        AND fa.user_id = auth.uid()
        AND fa.is_active = true
    )
  );

CREATE POLICY consent_records_select_family_access ON public.consent_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.family_access fa
      WHERE fa.client_id = consent_records.client_id
        AND fa.user_id = auth.uid()
        AND fa.is_active = true
        AND fa.access_level = 'full'
    )
  );

CREATE POLICY sar_requests_select_family_access ON public.sar_requests
  FOR SELECT USING (
    requester_email = (SELECT email FROM public.users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.family_access fa
      WHERE fa.client_id = sar_requests.client_id
        AND fa.user_id = auth.uid()
        AND fa.is_active = true
        AND fa.access_level = 'full'
    )
  );

CREATE POLICY family_briefings_select_family_access ON public.family_briefings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.family_access fa
      WHERE fa.client_id = family_briefings.client_id
        AND fa.user_id = auth.uid()
        AND fa.is_active = true
    )
  );

CREATE INDEX IF NOT EXISTS idx_client_access_user ON public.client_access(user_id);
CREATE INDEX IF NOT EXISTS idx_client_access_client ON public.client_access(client_id);
CREATE INDEX IF NOT EXISTS idx_client_access_org ON public.client_access(organisation_id);
CREATE INDEX IF NOT EXISTS idx_consent_records_org ON public.consent_records(organisation_id);

NOTIFY pgrst, 'reload schema';
