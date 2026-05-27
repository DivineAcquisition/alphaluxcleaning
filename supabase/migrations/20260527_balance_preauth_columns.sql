-- Balance pre-authorization columns on bookings.
--
-- AlphaLux charges a 50% deposit at checkout via PaymentIntent
-- (existing flow) and now ALSO places a Stripe authorization-only
-- hold on the customer's saved card for the remaining 50% — so we
-- can verify the funds are available BEFORE the cleaning happens
-- and capture them after service without the hosted-invoice email
-- back-and-forth.
--
-- Lifecycle:
--   * 'pending'           — first auth attempt scheduled, not yet run
--   * 'authorized'        — Stripe placed the hold; the PI is in
--                           'requires_capture'. Card funds are
--                           reserved for ~7 days.
--   * 'failed'            — last attempt failed; will retry until
--                           balance_auth_attempts >= 3.
--   * 'cancelled_booking' — 3 attempts exhausted, booking was
--                           cancelled and deposit refunded.
--   * 'captured'          — cleaning completed, hold was captured
--                           and is now a real charge.
--   * 'released'          — booking was cancelled / refunded; hold
--                           was explicitly cancelled before capture.
--
-- The retry-balance-authorizations sweep schedules attempts so the
-- hold is fresh on the service date — Stripe's 7-day auth window
-- means a hold placed 14 days before service expires before we can
-- capture, so the sweep re-authorizes at T-72h (attempt 2) and
-- T-24h (attempt 3) for any booking whose original hold has lapsed.

alter table if exists public.bookings
  add column if not exists balance_auth_payment_intent_id text,
  add column if not exists balance_auth_status text,
  add column if not exists balance_auth_amount_cents integer,
  add column if not exists balance_auth_attempts integer not null default 0,
  add column if not exists balance_auth_last_attempt_at timestamptz,
  add column if not exists balance_auth_last_error text,
  add column if not exists balance_auth_last_error_code text,
  add column if not exists balance_auth_authorized_at timestamptz,
  add column if not exists balance_auth_expires_at timestamptz,
  add column if not exists balance_auth_next_retry_at timestamptz,
  add column if not exists balance_auth_captured_at timestamptz,
  add column if not exists balance_auth_released_at timestamptz,
  add column if not exists balance_auth_cancelled_at timestamptz;

-- Sweep query covers two cases:
--   1. status = 'failed' AND attempts < 3 AND next_retry_at <= now()
--   2. status = 'authorized' AND expires_at < (service_date - 24h)
--
-- Indexing balance_auth_next_retry_at supports the cron sweep
-- without a full table scan once the bookings table grows.
create index if not exists bookings_balance_auth_next_retry_idx
  on public.bookings(balance_auth_next_retry_at)
  where balance_auth_status in ('pending', 'failed');

-- And a separate index for the expiration sweep so we can find
-- holds that need a fresh auth before the cleaning lands.
create index if not exists bookings_balance_auth_expires_idx
  on public.bookings(balance_auth_expires_at)
  where balance_auth_status = 'authorized';

-- Status-only index for ops dashboards that filter by lifecycle
-- state (e.g. "show me everything where we couldn't reauthorize").
create index if not exists bookings_balance_auth_status_idx
  on public.bookings(balance_auth_status)
  where balance_auth_status is not null;

comment on column public.bookings.balance_auth_payment_intent_id is
  'Stripe PaymentIntent id for the balance authorization-only hold (capture_method=manual). Distinct from stripe_payment_intent_id which is the deposit charge.';
comment on column public.bookings.balance_auth_status is
  'Lifecycle: pending, authorized, failed, captured, released, cancelled_booking.';
comment on column public.bookings.balance_auth_attempts is
  'Number of authorize attempts (incremented on every retry). After 3 failed attempts the booking is cancelled and the deposit refunded.';

-- cancelled_at lets ops sort/filter cancelled bookings by when
-- they were cancelled, separate from updated_at (which moves any
-- time the row is touched). cancellation_reason already exists on
-- the table from an earlier migration.
alter table if exists public.bookings
  add column if not exists cancelled_at timestamptz;

create index if not exists bookings_cancelled_at_idx
  on public.bookings(cancelled_at)
  where cancelled_at is not null;
