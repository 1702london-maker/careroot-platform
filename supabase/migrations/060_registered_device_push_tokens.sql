ALTER TABLE public.registered_devices
  ADD COLUMN IF NOT EXISTS push_token TEXT,
  ADD COLUMN IF NOT EXISTS push_token_updated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_registered_devices_push_token
  ON public.registered_devices (push_token)
  WHERE push_token IS NOT NULL;
