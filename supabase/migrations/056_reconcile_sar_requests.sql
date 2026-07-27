-- Migration 56: Reconcile SAR workflow table used by app routes

CREATE TABLE IF NOT EXISTS public.sar_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID REFERENCES public.organisations(id),
  client_id UUID REFERENCES public.clients(id),
  requester_name TEXT,
  requester_relationship TEXT,
  requester_email TEXT,
  reason TEXT,
  requested_by UUID REFERENCES public.users(id),
  request_date DATE DEFAULT CURRENT_DATE,
  deadline_date DATE,
  status TEXT DEFAULT 'received',
  notes TEXT,
  data_provided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sar_requests
  ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES public.organisations(id),
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id),
  ADD COLUMN IF NOT EXISTS requester_name TEXT,
  ADD COLUMN IF NOT EXISTS requester_relationship TEXT,
  ADD COLUMN IF NOT EXISTS requester_email TEXT,
  ADD COLUMN IF NOT EXISTS reason TEXT,
  ADD COLUMN IF NOT EXISTS requested_by UUID REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS request_date DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS deadline_date DATE,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'received',
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS data_provided_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

UPDATE public.sar_requests
SET request_date = COALESCE(request_date, CURRENT_DATE)
WHERE request_date IS NULL;

UPDATE public.sar_requests
SET deadline_date = COALESCE(deadline_date, request_date + INTERVAL '30 days', CURRENT_DATE + INTERVAL '30 days')
WHERE deadline_date IS NULL;

UPDATE public.sar_requests
SET status = 'received'
WHERE status = 'pending';

ALTER TABLE public.sar_requests
  ALTER COLUMN organisation_id SET NOT NULL,
  ALTER COLUMN client_id SET NOT NULL,
  ALTER COLUMN requester_name SET NOT NULL,
  ALTER COLUMN request_date SET NOT NULL,
  ALTER COLUMN deadline_date SET NOT NULL,
  ALTER COLUMN status SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'sar_requests_status_check'
      AND conrelid = 'public.sar_requests'::regclass
  ) THEN
    ALTER TABLE public.sar_requests
      ADD CONSTRAINT sar_requests_status_check
      CHECK (status IN ('received', 'pending', 'in_progress', 'completed', 'refused'));
  END IF;
END $$;

ALTER TABLE public.sar_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sar_requests_org_select ON public.sar_requests;
DROP POLICY IF EXISTS sar_requests_org_insert ON public.sar_requests;
DROP POLICY IF EXISTS sar_requests_org_update ON public.sar_requests;

CREATE POLICY sar_requests_org_select ON public.sar_requests
  FOR SELECT USING (
    organisation_id = (SELECT organisation_id FROM public.users WHERE id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.family_access fa
      WHERE fa.client_id = sar_requests.client_id
        AND fa.user_id = auth.uid()
        AND fa.is_active = true
    )
  );

CREATE POLICY sar_requests_org_insert ON public.sar_requests
  FOR INSERT WITH CHECK (
    organisation_id = (SELECT organisation_id FROM public.users WHERE id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.family_access fa
      WHERE fa.client_id = sar_requests.client_id
        AND fa.user_id = auth.uid()
        AND fa.is_active = true
    )
  );

CREATE POLICY sar_requests_org_update ON public.sar_requests
  FOR UPDATE USING (
    organisation_id = (SELECT organisation_id FROM public.users WHERE id = auth.uid())
    AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('superadmin', 'org_admin', 'manager')
  );

CREATE INDEX IF NOT EXISTS idx_sar_requests_org ON public.sar_requests(organisation_id);
CREATE INDEX IF NOT EXISTS idx_sar_requests_client ON public.sar_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_sar_requests_deadline ON public.sar_requests(deadline_date);
CREATE INDEX IF NOT EXISTS idx_sar_requests_status ON public.sar_requests(status);
