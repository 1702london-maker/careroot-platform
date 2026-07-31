-- Repair direct client portal access on live production.
-- Some environments had the client portal UI/API but not the client_access table.

CREATE TABLE IF NOT EXISTS public.client_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  access_level TEXT NOT NULL DEFAULT 'full',
  is_active BOOLEAN NOT NULL DEFAULT true,
  invited_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, user_id)
);

ALTER TABLE public.client_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS client_access_self_select ON public.client_access;
DROP POLICY IF EXISTS client_access_office_org ON public.client_access;

CREATE POLICY client_access_self_select
ON public.client_access
FOR SELECT
USING (
  user_id = auth.uid()
  AND is_active = true
);

CREATE POLICY client_access_office_org
ON public.client_access
FOR ALL
USING (
  organisation_id IN (
    SELECT organisation_id
    FROM public.users
    WHERE id = auth.uid()
      AND role IN ('superadmin', 'org_admin', 'manager', 'coordinator')
  )
)
WITH CHECK (
  organisation_id IN (
    SELECT organisation_id
    FROM public.users
    WHERE id = auth.uid()
      AND role IN ('superadmin', 'org_admin', 'manager', 'coordinator')
  )
);

CREATE INDEX IF NOT EXISTS idx_client_access_user
ON public.client_access(user_id);

CREATE INDEX IF NOT EXISTS idx_client_access_client
ON public.client_access(client_id);

CREATE INDEX IF NOT EXISTS idx_client_access_org
ON public.client_access(organisation_id);

NOTIFY pgrst, 'reload schema';
