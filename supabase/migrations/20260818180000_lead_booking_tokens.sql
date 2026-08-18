-- Lead-bound internal-booking tokens.
-- Minted when a new GHL/Facebook lead is pinged to a market inbox.
-- The token is the URL credential for /admin/internal-booking/l/<token>:
-- that page is the internal booking form prefilled for this one lead,
-- locked to deposit + pre-auth (pay link sent to the customer via
-- OpenPhone when the VA books them in).

CREATE TABLE IF NOT EXISTS public.lead_booking_tokens (
  token text PRIMARY KEY,
  ghl_contact_id text NOT NULL UNIQUE,
  first_name text,
  last_name text,
  email text,
  phone text,
  zip_code text,
  city text,
  state_code text,
  source text,
  booking_id uuid,
  booked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lead_booking_tokens_created_at_idx
  ON public.lead_booking_tokens (created_at DESC);

COMMENT ON TABLE public.lead_booking_tokens IS
  'One unguessable token per GHL contact so the market-inbox SMS can link to a lead-specific internal booking page.';

ALTER TABLE public.ghl_new_lead_notifications
  ADD COLUMN IF NOT EXISTS booking_token text;

ALTER TABLE public.lead_booking_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lead_booking_tokens_service_role_all
  ON public.lead_booking_tokens;
CREATE POLICY lead_booking_tokens_service_role_all
  ON public.lead_booking_tokens
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS lead_booking_tokens_admin_all
  ON public.lead_booking_tokens;
CREATE POLICY lead_booking_tokens_admin_all
  ON public.lead_booking_tokens
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );
