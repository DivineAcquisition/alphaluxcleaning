-- Ledger for GHL → market-number new-lead SMS pings.
-- Claimed atomically on ghl_contact_id so ContactCreate retries and
-- Facebook Lead Form + Contact Created double-fires never double-text
-- the VA inbox.

CREATE TABLE IF NOT EXISTS public.ghl_new_lead_notifications (
  ghl_contact_id text PRIMARY KEY,
  email text,
  phone_digits text,
  first_name text,
  last_name text,
  zip_code text,
  state_code text,
  source text,
  notified_number text,
  provider_message_id text,
  notified_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ghl_new_lead_notifications_notified_at_idx
  ON public.ghl_new_lead_notifications (notified_at DESC);

COMMENT ON TABLE public.ghl_new_lead_notifications IS
  'Idempotency ledger: one GHL-number SMS to the zip-matched market inbox per new GHL contact (Facebook Lead Ads + every other Contact Create).';
