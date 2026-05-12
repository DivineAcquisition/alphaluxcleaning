-- Card-on-file columns on customers.
--
-- We attach customer cards to the Stripe Customer via
-- `setup_future_usage: 'off_session'` on the deposit PaymentIntent.
-- After the PI succeeds the stripe-webhook handler promotes that
-- PaymentMethod to `invoice_settings.default_payment_method` on the
-- Customer so future invoices (balance invoices, recurring visits,
-- upsells) auto-charge against the saved card instead of falling
-- back to the hosted-invoice-email path.
--
-- These columns mirror that state onto our customers row so the
-- admin dashboard / send-balance-invoice / charge-recurring-visit
-- can answer "do we have a card on file?" without a Stripe API
-- round-trip on every read.
--
-- `stripe_default_payment_method_id` — the pm_… id Stripe has marked
--   as the customer's default invoice PM. NULL until the customer
--   completes their first deposit.
-- `stripe_card_on_file` — convenience boolean for UI checks.
-- `stripe_card_on_file_at` — when we first promoted a card.

alter table if exists public.customers
  add column if not exists stripe_default_payment_method_id text,
  add column if not exists stripe_card_on_file boolean not null default false,
  add column if not exists stripe_card_on_file_at timestamptz;

create index if not exists customers_stripe_card_on_file_idx
  on public.customers(stripe_card_on_file)
  where stripe_card_on_file = true;
