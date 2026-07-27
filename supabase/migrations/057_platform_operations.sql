-- Migration 57: Platform operations, audit log, cron health, feature flags

CREATE TABLE IF NOT EXISTS public.platform_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID REFERENCES public.organisations(id),
  actor_user_id UUID REFERENCES public.users(id),
  actor_email TEXT,
  actor_role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cron_run_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  path TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('started', 'success', 'failed', 'unauthorised')),
  started_at TIMESTAMPTZ DEFAULT now(),
  finished_at TIMESTAMPTZ,
  duration_ms INTEGER,
  result JSONB DEFAULT '{}'::jsonb,
  error TEXT
);

CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID REFERENCES public.organisations(id),
  flag_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  config JSONB DEFAULT '{}'::jsonb,
  updated_by UUID REFERENCES public.users(id),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (organisation_id, flag_key)
);

ALTER TABLE public.platform_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cron_run_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS platform_audit_superadmin_read ON public.platform_audit_logs;
DROP POLICY IF EXISTS platform_audit_service_insert ON public.platform_audit_logs;
DROP POLICY IF EXISTS cron_run_logs_superadmin_read ON public.cron_run_logs;
DROP POLICY IF EXISTS cron_run_logs_service_insert ON public.cron_run_logs;
DROP POLICY IF EXISTS feature_flags_superadmin_all ON public.feature_flags;
DROP POLICY IF EXISTS feature_flags_org_read ON public.feature_flags;

CREATE POLICY platform_audit_superadmin_read ON public.platform_audit_logs
  FOR SELECT USING (public.current_user_role() = 'superadmin');

CREATE POLICY platform_audit_service_insert ON public.platform_audit_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY cron_run_logs_superadmin_read ON public.cron_run_logs
  FOR SELECT USING (public.current_user_role() = 'superadmin');

CREATE POLICY cron_run_logs_service_insert ON public.cron_run_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY feature_flags_superadmin_all ON public.feature_flags
  FOR ALL USING (public.current_user_role() = 'superadmin')
  WITH CHECK (public.current_user_role() = 'superadmin');

CREATE POLICY feature_flags_org_read ON public.feature_flags
  FOR SELECT USING (
    organisation_id = (SELECT organisation_id FROM public.users WHERE id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_platform_audit_created ON public.platform_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_audit_org ON public.platform_audit_logs(organisation_id);
CREATE INDEX IF NOT EXISTS idx_platform_audit_actor ON public.platform_audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_platform_audit_action ON public.platform_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_cron_run_logs_job ON public.cron_run_logs(job_name, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_cron_run_logs_status ON public.cron_run_logs(status);
CREATE INDEX IF NOT EXISTS idx_feature_flags_org ON public.feature_flags(organisation_id);
