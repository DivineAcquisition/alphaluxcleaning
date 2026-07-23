-- ============================================================================
-- Lifecycle SMS + Email Engine (Reactivation, New Offers, Campaigns)
--
-- Turns the customer list into a self-running growth engine:
--   * Every customer gets a "time since last booking" clock
--     (customers.last_booking_at, maintained by triggers + refresh fn).
--   * A cadence of admin-configurable steps (Day 14/30/45/60/90 reactivation,
--     Day 3 recurring-conversion pitch, loyalty track for recurring members)
--     is evaluated per customer by the `lifecycle-engine` edge function.
--   * Admin-launched Offers (targeted audiences) and Campaigns (one-off
--     broadcasts) ride the same rails: opt-outs, quiet hours, frequency cap.
--   * SMS goes out through OpenPhone using the STATE-ROUTED business number
--     (NJ / TX / CA / NY each have their own number — see sms_state_numbers).
--   * Email goes out through Resend.
--   * Every send is logged in lifecycle_sends; bookings and recurring
--     signups that follow within the attribution window are stamped back
--     onto the last touch so admin sees what converts.
--
-- Money rule (enforced by convention in offer/campaign incentives): all
-- discounts and credits come from company margin — cleaner pay is always
-- calculated off the full, pre-discount job value.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Customer retention columns (ported from the Novara retention model)
-- ---------------------------------------------------------------------------
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS last_booking_at timestamptz,
  ADD COLUMN IF NOT EXISTS first_service_at timestamptz,
  ADD COLUMN IF NOT EXISTS total_bookings integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed_bookings integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lifecycle_stage text NOT NULL DEFAULT 'lead',
  ADD COLUMN IF NOT EXISTS is_recurring_member boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS timezone text;

COMMENT ON COLUMN public.customers.last_booking_at IS
  'Most recent past service date (completed or confirmed). The lifecycle cadence clock.';
COMMENT ON COLUMN public.customers.lifecycle_stage IS
  'lead | active | recurring | lapsed — derived by refresh_customer_retention().';

CREATE INDEX IF NOT EXISTS customers_last_booking_at_idx
  ON public.customers (last_booking_at);
CREATE INDEX IF NOT EXISTS customers_lifecycle_stage_idx
  ON public.customers (lifecycle_stage);

-- ---------------------------------------------------------------------------
-- 2. Engine settings (singleton) — admin-owned strategy knobs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lifecycle_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  engine_enabled boolean NOT NULL DEFAULT true,
  -- Local-time send window (customer's timezone): sends allowed when
  -- quiet_hours_start <= local hour < quiet_hours_end.
  quiet_hours_start integer NOT NULL DEFAULT 9 CHECK (quiet_hours_start BETWEEN 0 AND 23),
  quiet_hours_end integer NOT NULL DEFAULT 20 CHECK (quiet_hours_end BETWEEN 1 AND 24),
  -- Max lifecycle touches (cadence + offers + campaigns) per customer per
  -- rolling 7 days. The engine defers instead of dropping.
  frequency_cap_per_week integer NOT NULL DEFAULT 2 CHECK (frequency_cap_per_week >= 1),
  -- A booking within this many days of a send is attributed to that send.
  attribution_window_days integer NOT NULL DEFAULT 14,
  -- A cadence step stays sendable for this many days past its day_offset;
  -- after that it's considered missed (prevents blasting old customers
  -- with every past-due step on first deploy).
  cadence_grace_days integer NOT NULL DEFAULT 7,
  -- After this many days without a booking the customer is marked lapsed
  -- and the automatic cadence stops (they stay in campaign audiences).
  lapsed_after_days integer NOT NULL DEFAULT 120,
  default_timezone text NOT NULL DEFAULT 'America/New_York',
  booking_link text NOT NULL DEFAULT 'https://alphaluxcleaning.com/book/zip',
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.lifecycle_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. State-routed OpenPhone numbers (SMS "from" per service state)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sms_state_numbers (
  state_code text PRIMARY KEY,          -- 'NJ' | 'TX' | 'CA' | 'NY'
  phone_e164 text NOT NULL,             -- OpenPhone number in E.164
  openphone_phone_id text,              -- optional OpenPhone phoneNumberId (PN...)
  timezone text NOT NULL,               -- default customer tz for the state
  is_default boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.sms_state_numbers (state_code, phone_e164, timezone, is_default) VALUES
  ('NJ', '+15512399444', 'America/New_York',    true),
  ('TX', '+19725590223', 'America/Chicago',     false),
  ('CA', '+13233005528', 'America/Los_Angeles', false),
  ('NY', '+16313668565', 'America/New_York',    false)
ON CONFLICT (state_code) DO UPDATE
  SET phone_e164 = EXCLUDED.phone_e164,
      timezone   = EXCLUDED.timezone,
      updated_at = now();

-- ---------------------------------------------------------------------------
-- 4. Opt-outs (global, per channel). STOP means stop — forever.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sms_opt_outs (
  phone_digits text PRIMARY KEY,        -- 10-digit US core, for matching
  phone_e164 text,
  source text NOT NULL DEFAULT 'stop_keyword',  -- stop_keyword | admin | import
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_opt_outs (
  email text PRIMARY KEY,               -- lowercased
  source text NOT NULL DEFAULT 'unsubscribe_link', -- unsubscribe_link | admin | bounce | import
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 5. SMS ledgers (all outbound through _shared/sms.ts + inbound webhook)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sms_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_phone text,
  from_number text,
  state_code text,
  message text,
  provider text,                        -- openphone | ghl
  provider_message_id text,
  status text NOT NULL DEFAULT 'sent',  -- sent | failed | suppressed
  error text,
  context text,                         -- caller tag: booking_confirm, lifecycle:day_30, ...
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sms_logs_to_phone_idx ON public.sms_logs (to_phone);
CREATE INDEX IF NOT EXISTS sms_logs_created_idx ON public.sms_logs (created_at DESC);

CREATE TABLE IF NOT EXISTS public.sms_inbound_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'openphone',
  from_phone text,
  to_phone text,                        -- which of our state numbers received it
  body text,
  matched_keyword text,                 -- STOP / START / null
  action text,                          -- opted_out | opted_in | reply
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sms_inbound_from_idx ON public.sms_inbound_log (from_phone);

-- ---------------------------------------------------------------------------
-- 6. Cadence steps (admin-configurable: day counts, copy, channel, on/off)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lifecycle_cadence_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  step_key text UNIQUE NOT NULL,        -- day_3, day_14, day_30, ...
  name text NOT NULL,
  -- reactivation          → customers NOT on a recurring plan
  -- recurring_conversion  → post-first-clean push (completed_bookings = 1)
  -- loyalty               → customers ON a recurring plan (lighter track)
  track text NOT NULL CHECK (track IN ('reactivation', 'recurring_conversion', 'loyalty')),
  day_offset integer NOT NULL CHECK (day_offset >= 0),
  channel text NOT NULL CHECK (channel IN ('sms', 'email', 'both')),
  enabled boolean NOT NULL DEFAULT true,
  sms_body text,
  email_subject text,
  email_body text,
  -- {"description": "...", "type": "credit", "value_usd": 25}
  -- Incentives ALWAYS come from company margin, never cleaner pay.
  incentive jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed the cadence from the launch strategy. Copy placeholders:
-- {{first_name}} {{last_service_type}} {{days_since}} {{last_clean_date}}
-- {{completed_cleans}} {{booking_link}} {{incentive_text}}
-- The engine appends the compliant SMS footer ("Reply STOP to opt out")
-- and wraps emails in the branded shell with an unsubscribe footer.
INSERT INTO public.lifecycle_cadence_steps
  (step_key, name, track, day_offset, channel, sms_body, email_subject, email_body, incentive, sort_order)
VALUES
  (
    'day_3', 'Day 3 — post-first-clean recurring pitch', 'recurring_conversion', 3, 'sms',
    'Hi {{first_name}}! So glad your {{last_service_type}} clean went well. Want your home to always feel this way? Our recurring plan means priority scheduling and never thinking about it again — plus {{incentive_text}}. Set it up in 2 min: {{booking_link}}',
    NULL, NULL,
    '{"description": "a $25 credit on your first recurring visit", "type": "credit", "value_usd": 25}',
    10
  ),
  (
    'day_14', 'Day 14 — friendly check-in', 'reactivation', 14, 'sms',
    'Hi {{first_name}}! Hope your home still feels great after your {{last_service_type}} clean on {{last_clean_date}}. Ready for the next one? Book in 2 minutes: {{booking_link}}',
    NULL, NULL, '{}', 20
  ),
  (
    'day_30', 'Day 30 — reactivation + recurring intro', 'reactivation', 30, 'email',
    NULL,
    '{{first_name}}, it''s been a month — let''s keep your home feeling fresh',
    '<p>Hi {{first_name}},</p><p>It''s been about {{days_since}} days since your {{last_service_type}} clean with AlphaLux — around the time most homes are ready for a refresh.</p><p>If you''d rather never think about it again, our <strong>recurring plan</strong> keeps your home on a schedule automatically: priority booking, the same great cleaners, and a small loyalty perk on every visit.</p><p>Either way, we''d love to have you back.</p>',
    '{}', 30
  ),
  (
    'day_45', 'Day 45 — reactivation + first-recurring incentive', 'reactivation', 45, 'sms',
    '{{first_name}}, it''s been {{days_since}} days since your last AlphaLux clean. Start a recurring plan this week and get {{incentive_text}} — or grab a one-time refresh anytime: {{booking_link}}',
    NULL, NULL,
    '{"description": "a $25 credit on your first recurring visit", "type": "credit", "value_usd": 25}',
    40
  ),
  (
    'day_60', 'Day 60 — we miss you', 'reactivation', 60, 'sms',
    'We miss you, {{first_name}}! Come back for a one-time clean — or better, lock in a recurring plan with {{incentive_text}} and never lift a finger again: {{booking_link}}',
    NULL, NULL,
    '{"description": "a $35 credit + priority scheduling", "type": "credit", "value_usd": 35}',
    50
  ),
  (
    'day_90', 'Day 90 — win-back offer', 'reactivation', 90, 'email',
    NULL,
    'We''d love to have you back, {{first_name}} — here''s something special',
    '<p>Hi {{first_name}},</p><p>It''s been a while since your last clean with us ({{last_clean_date}}), and we''d genuinely love to have you back.</p><p>To make it easy: <strong>{{incentive_text}}</strong> — good for a one-time clean or, even better, your first visit on a recurring plan (where the perks keep coming).</p><p>No pressure, no expiration games. Whenever you''re ready, we''re here.</p>',
    '{"description": "a $50 welcome-back credit", "type": "credit", "value_usd": 50}',
    60
  ),
  (
    'loyalty_30', 'Monthly loyalty touch (recurring members)', 'loyalty', 30, 'email',
    NULL,
    'Thanks for being an AlphaLux member, {{first_name}}',
    '<p>Hi {{first_name}},</p><p>Just a note to say thanks for being on a recurring plan with AlphaLux — you''ve had <strong>{{completed_cleans}}</strong> cleans with us so far.</p><p>As a member you always get priority scheduling, and if you ever want to adjust your frequency, add a deep clean, or gift a clean to someone, just reply to this email.</p>',
    '{}', 100
  )
ON CONFLICT (step_key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 7. Offers (targeted promos) + Campaigns (manual broadcasts)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lifecycle_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  -- new_0_30 | lapsed_31_90 | lapsed_90_plus | active | recurring_members | all | custom
  audience text NOT NULL DEFAULT 'lapsed_31_90',
  -- custom filter: {"states": ["NJ"], "service_types": ["deep"]}
  custom_filter jsonb NOT NULL DEFAULT '{}'::jsonb,
  channel text NOT NULL CHECK (channel IN ('sms', 'email', 'both')),
  sms_body text,
  email_subject text,
  email_body text,
  incentive jsonb NOT NULL DEFAULT '{}'::jsonb,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,                  -- expiring offers stop sending after this
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'ended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lifecycle_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  segment text NOT NULL DEFAULT 'all',  -- same audience values as offers
  custom_filter jsonb NOT NULL DEFAULT '{}'::jsonb,
  channel text NOT NULL CHECK (channel IN ('sms', 'email', 'both')),
  sms_body text,
  email_subject text,
  email_body text,
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
  sent_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 8. Send log — every lifecycle touch, with attribution
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lifecycle_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
  phone_digits text,
  email text,
  track text NOT NULL CHECK (track IN ('cadence', 'offer', 'campaign')),
  step_id uuid REFERENCES public.lifecycle_cadence_steps(id) ON DELETE SET NULL,
  offer_id uuid REFERENCES public.lifecycle_offers(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES public.lifecycle_campaigns(id) ON DELETE SET NULL,
  -- The last_booking_at date the cadence step was evaluated against. A new
  -- booking moves the anchor, so the same step can legitimately fire again
  -- in a later cycle — but never twice for the same cycle.
  anchor_date date,
  channel text NOT NULL CHECK (channel IN ('sms', 'email')),
  subject text,
  body text,
  status text NOT NULL CHECK (status IN ('sent', 'failed', 'skipped', 'deferred')),
  skip_reason text,                     -- opted_out | quiet_hours | frequency_cap | no_phone | no_email | ...
  provider text,
  provider_message_id text,
  from_number text,
  replied_at timestamptz,
  attributed_booking_id uuid,
  attributed_recurring_id uuid,
  attributed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lifecycle_sends_customer_idx
  ON public.lifecycle_sends (customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS lifecycle_sends_phone_idx
  ON public.lifecycle_sends (phone_digits);

-- Dedupe guarantees (only successful sends block a re-send):
CREATE UNIQUE INDEX IF NOT EXISTS lifecycle_sends_step_once
  ON public.lifecycle_sends (customer_id, step_id, anchor_date, channel)
  WHERE status = 'sent' AND step_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS lifecycle_sends_offer_once
  ON public.lifecycle_sends (customer_id, offer_id, channel)
  WHERE status = 'sent' AND offer_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS lifecycle_sends_campaign_once
  ON public.lifecycle_sends (customer_id, campaign_id, channel)
  WHERE status = 'sent' AND campaign_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 9. Retention refresh + triggers (the cadence clock)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.refresh_customer_retention(p_customer_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lapsed_days integer;
BEGIN
  SELECT lapsed_after_days INTO v_lapsed_days
  FROM public.lifecycle_settings WHERE id = 1;
  v_lapsed_days := COALESCE(v_lapsed_days, 120);

  UPDATE public.customers c
  SET
    total_bookings      = stats.total,
    completed_bookings  = stats.completed,
    first_service_at    = stats.first_completed,
    last_booking_at     = stats.last_service,
    is_recurring_member = stats.recurring,
    lifecycle_stage     = CASE
      WHEN stats.recurring THEN 'recurring'
      WHEN stats.last_service IS NULL THEN 'lead'
      WHEN stats.last_service < now() - make_interval(days => v_lapsed_days) THEN 'lapsed'
      ELSE 'active'
    END
  FROM (
    SELECT
      cu.id AS customer_id,
      COUNT(b.id) FILTER (WHERE b.status IS DISTINCT FROM 'cancelled') AS total,
      COUNT(b.id) FILTER (WHERE b.status = 'completed') AS completed,
      (MIN(b.service_date) FILTER (WHERE b.status = 'completed'))::timestamptz AS first_completed,
      (MAX(b.service_date) FILTER (
        WHERE b.status IN ('completed', 'confirmed') AND b.service_date <= CURRENT_DATE
      ))::timestamptz AS last_service,
      EXISTS (
        SELECT 1 FROM public.recurring_services rs
        WHERE rs.customer_id = cu.id AND rs.status = 'active'
      ) AS recurring
    FROM public.customers cu
    LEFT JOIN public.bookings b ON b.customer_id = cu.id
    WHERE p_customer_id IS NULL OR cu.id = p_customer_id
    GROUP BY cu.id
  ) stats
  WHERE c.id = stats.customer_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.tg_refresh_retention_from_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.refresh_customer_retention(COALESCE(NEW.customer_id, OLD.customer_id));
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS bookings_refresh_retention ON public.bookings;
CREATE TRIGGER bookings_refresh_retention
  AFTER INSERT OR DELETE OR UPDATE OF status, service_date
  ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_refresh_retention_from_booking();

CREATE OR REPLACE FUNCTION public.tg_refresh_retention_from_recurring()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.refresh_customer_retention(COALESCE(NEW.customer_id, OLD.customer_id));
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS recurring_services_refresh_retention ON public.recurring_services;
CREATE TRIGGER recurring_services_refresh_retention
  AFTER INSERT OR DELETE OR UPDATE OF status
  ON public.recurring_services
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_refresh_retention_from_recurring();

-- Backfill retention for the existing customer base.
SELECT public.refresh_customer_retention();

-- ---------------------------------------------------------------------------
-- 10. Attribution triggers (booking + recurring signup → last touch)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tg_lifecycle_attribute_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window integer;
  v_send_id uuid;
BEGIN
  SELECT attribution_window_days INTO v_window
  FROM public.lifecycle_settings WHERE id = 1;

  SELECT id INTO v_send_id
  FROM public.lifecycle_sends
  WHERE customer_id = NEW.customer_id
    AND status = 'sent'
    AND attributed_booking_id IS NULL
    AND created_at > now() - make_interval(days => COALESCE(v_window, 14))
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_send_id IS NOT NULL THEN
    UPDATE public.lifecycle_sends
    SET attributed_booking_id = NEW.id, attributed_at = now()
    WHERE id = v_send_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_lifecycle_attribution ON public.bookings;
CREATE TRIGGER bookings_lifecycle_attribution
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_lifecycle_attribute_booking();

CREATE OR REPLACE FUNCTION public.tg_lifecycle_attribute_recurring()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window integer;
  v_send_id uuid;
BEGIN
  SELECT attribution_window_days INTO v_window
  FROM public.lifecycle_settings WHERE id = 1;

  SELECT id INTO v_send_id
  FROM public.lifecycle_sends
  WHERE customer_id = NEW.customer_id
    AND status = 'sent'
    AND attributed_recurring_id IS NULL
    AND created_at > now() - make_interval(days => COALESCE(v_window, 14))
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_send_id IS NOT NULL THEN
    UPDATE public.lifecycle_sends
    SET attributed_recurring_id = NEW.id, attributed_at = now()
    WHERE id = v_send_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS recurring_lifecycle_attribution ON public.recurring_services;
CREATE TRIGGER recurring_lifecycle_attribution
  AFTER INSERT ON public.recurring_services
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_lifecycle_attribute_recurring();

-- ---------------------------------------------------------------------------
-- 11. Analytics views (per-step / per-offer / per-campaign)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.lifecycle_step_stats AS
SELECT
  s.id, s.step_key, s.name, s.track, s.channel, s.day_offset, s.enabled,
  COUNT(ls.id) FILTER (WHERE ls.status = 'sent') AS sends,
  COUNT(ls.id) FILTER (WHERE ls.status = 'skipped') AS skips,
  COUNT(ls.id) FILTER (WHERE ls.status = 'deferred') AS deferrals,
  COUNT(ls.id) FILTER (WHERE ls.replied_at IS NOT NULL) AS replies,
  COUNT(ls.id) FILTER (WHERE ls.attributed_booking_id IS NOT NULL) AS attributed_bookings,
  COUNT(ls.id) FILTER (WHERE ls.attributed_recurring_id IS NOT NULL) AS attributed_recurring
FROM public.lifecycle_cadence_steps s
LEFT JOIN public.lifecycle_sends ls ON ls.step_id = s.id
GROUP BY s.id;

CREATE OR REPLACE VIEW public.lifecycle_offer_stats AS
SELECT
  o.id, o.name, o.audience, o.channel, o.status, o.starts_at, o.ends_at,
  COUNT(ls.id) FILTER (WHERE ls.status = 'sent') AS sends,
  COUNT(ls.id) FILTER (WHERE ls.replied_at IS NOT NULL) AS replies,
  COUNT(ls.id) FILTER (WHERE ls.attributed_booking_id IS NOT NULL) AS attributed_bookings,
  COUNT(ls.id) FILTER (WHERE ls.attributed_recurring_id IS NOT NULL) AS attributed_recurring
FROM public.lifecycle_offers o
LEFT JOIN public.lifecycle_sends ls ON ls.offer_id = o.id
GROUP BY o.id;

CREATE OR REPLACE VIEW public.lifecycle_campaign_stats AS
SELECT
  c.id, c.name, c.segment, c.channel, c.status, c.scheduled_at, c.sent_count,
  COUNT(ls.id) FILTER (WHERE ls.status = 'sent') AS sends,
  COUNT(ls.id) FILTER (WHERE ls.replied_at IS NOT NULL) AS replies,
  COUNT(ls.id) FILTER (WHERE ls.attributed_booking_id IS NOT NULL) AS attributed_bookings,
  COUNT(ls.id) FILTER (WHERE ls.attributed_recurring_id IS NOT NULL) AS attributed_recurring
FROM public.lifecycle_campaigns c
LEFT JOIN public.lifecycle_sends ls ON ls.campaign_id = c.id
GROUP BY c.id;

-- ---------------------------------------------------------------------------
-- 12. RLS — service role (edge functions) + admins (workspace UI)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'lifecycle_settings', 'sms_state_numbers', 'sms_opt_outs', 'email_opt_outs',
    'sms_logs', 'sms_inbound_log', 'lifecycle_cadence_steps',
    'lifecycle_offers', 'lifecycle_campaigns', 'lifecycle_sends'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_service_role_all', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)',
      t || '_service_role_all', t
    );
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_admin_all', t);
    EXECUTE format(
      $pol$CREATE POLICY %I ON public.%I FOR ALL TO authenticated
        USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'))
        WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'))$pol$,
      t || '_admin_all', t
    );
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- 13. Cron: run the engine + keep HCP syncs healthy
-- ---------------------------------------------------------------------------
-- Engine sweep every 20 minutes. Quiet hours are enforced per customer
-- inside the function, so a frequent schedule just means timely sends.
SELECT cron.schedule(
  'lifecycle-engine-run',
  '*/20 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://yltvknkqnzdeiqckqjha.functions.supabase.co/lifecycle-engine',
      headers := jsonb_build_object(
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsdHZrbmtxbnpkZWlxY2txamhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2OTk5MjAsImV4cCI6MjA3MzI3NTkyMH0.t1q4kcz8iu2I0UNStsU3Be4_vuqZ0LFQksdmwTpxIZ8',
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    );
  $$
);

-- Retry failed Housecall Pro job syncs every 30 minutes so every paid
-- booking reliably lands in HCP even after transient API failures.
SELECT cron.schedule(
  'retry-failed-hcp-syncs',
  '*/30 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://yltvknkqnzdeiqckqjha.functions.supabase.co/retry-failed-hcp-syncs',
      headers := jsonb_build_object(
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsdHZrbmtxbnpkZWlxY2txamhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2OTk5MjAsImV4cCI6MjA3MzI3NTkyMH0.t1q4kcz8iu2I0UNStsU3Be4_vuqZ0LFQksdmwTpxIZ8',
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    );
  $$
);

-- Hourly HCP safety net: any recent paid booking without an hcp_job_id is
-- re-pushed through the canonical hcp-sync-booking path (idempotent).
SELECT cron.schedule(
  'ensure-recent-bookings-hcp-synced',
  '10 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://yltvknkqnzdeiqckqjha.functions.supabase.co/ensure-recent-bookings-hcp-synced',
      headers := jsonb_build_object(
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsdHZrbmtxbnpkZWlxY2txamhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2OTk5MjAsImV4cCI6MjA3MzI3NTkyMH0.t1q4kcz8iu2I0UNStsU3Be4_vuqZ0LFQksdmwTpxIZ8',
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object('n', 20)
    );
  $$
);
