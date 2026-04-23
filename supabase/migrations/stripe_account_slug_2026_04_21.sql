-- Multi-account Stripe routing
--
-- Adds a `stripe_account_slug` column on `bookings` and `customers`
-- so each payment row is permanently bound to the Stripe account it
-- was processed against. The router in the Edge Functions
-- (`_shared/stripe-accounts.ts`) will:
--
--   * stamp this column when a PaymentIntent is created against an
--     account, and
--   * read this column on every downstream flow (balance invoice,
--     refund, reconciliation).
--
-- Default is `alphalux_ny` because every historical row lived on the
-- NY account; once the CA/TX account kill-switch is enabled, new
-- rows will be stamped `alphalux_catx` at create-payment-intent
-- time based on the service ZIP.

alter table if exists public.bookings
  add column if not exists stripe_account_slug text not null default 'alphalux_ny';

create index if not exists bookings_stripe_account_slug_idx
  on public.bookings(stripe_account_slug);

alter table if exists public.customers
  add column if not exists stripe_account_slug text;

create index if not exists customers_stripe_account_slug_idx
  on public.customers(stripe_account_slug);
