-- Production blocker reconciliation: Stripe plan compatibility and document uploads.

ALTER TABLE public.organisations
ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'seed';

ALTER TABLE public.organisations
DROP CONSTRAINT IF EXISTS organisations_plan_check;

ALTER TABLE public.organisations
ADD CONSTRAINT organisations_plan_check
CHECK (plan IN ('seed', 'grow', 'scale', 'enterprise'));

ALTER TABLE public.organisations
DROP CONSTRAINT IF EXISTS organisations_subscription_tier_check;

ALTER TABLE public.organisations
ADD CONSTRAINT organisations_subscription_tier_check
CHECK (
  subscription_tier IS NULL
  OR subscription_tier IN ('starter', 'growth', 'enterprise', 'seed', 'grow', 'scale')
);

UPDATE public.organisations
SET plan = CASE
  WHEN plan IN ('seed', 'grow', 'scale', 'enterprise') THEN plan
  WHEN subscription_tier = 'starter' THEN 'seed'
  WHEN subscription_tier = 'growth' THEN 'grow'
  WHEN subscription_tier = 'enterprise' THEN 'enterprise'
  WHEN subscription_tier IN ('seed', 'grow', 'scale') THEN subscription_tier
  ELSE 'seed'
END
WHERE plan IS NULL OR plan NOT IN ('seed', 'grow', 'scale', 'enterprise');

CREATE TABLE IF NOT EXISTS public.client_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_path TEXT,
  file_size BIGINT,
  mime_type TEXT,
  category TEXT NOT NULL DEFAULT 'assessment',
  uploaded_by UUID REFERENCES public.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.client_documents
ADD COLUMN IF NOT EXISTS file_path TEXT,
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS mime_type TEXT;

ALTER TABLE public.staff_documents
ADD COLUMN IF NOT EXISTS file_path TEXT,
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS mime_type TEXT;

ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org members can manage client documents" ON public.client_documents;
CREATE POLICY "org members can manage client documents"
ON public.client_documents FOR ALL
USING (
  organisation_id IN (
    SELECT organisation_id FROM public.users WHERE id = auth.uid()
  )
)
WITH CHECK (
  organisation_id IN (
    SELECT organisation_id FROM public.users WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "org staff_documents" ON public.staff_documents;
CREATE POLICY "org staff_documents"
ON public.staff_documents FOR ALL
USING (
  organisation_id IN (
    SELECT organisation_id FROM public.users WHERE id = auth.uid()
  )
)
WITH CHECK (
  organisation_id IN (
    SELECT organisation_id FROM public.users WHERE id = auth.uid()
  )
);

CREATE INDEX IF NOT EXISTS client_documents_client_id_idx ON public.client_documents(client_id);
CREATE INDEX IF NOT EXISTS client_documents_org_id_idx ON public.client_documents(organisation_id);
CREATE INDEX IF NOT EXISTS staff_documents_staff_id_idx ON public.staff_documents(staff_id);
CREATE INDEX IF NOT EXISTS staff_documents_org_id_idx ON public.staff_documents(organisation_id);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('client-documents', 'client-documents', false, 52428800, ARRAY[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]),
  ('staff-documents', 'staff-documents', false, 52428800, ARRAY[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ])
ON CONFLICT (id) DO NOTHING;
