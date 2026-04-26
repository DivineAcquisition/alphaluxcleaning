-- Stripe account slug column (legacy / forward-compat).
--
-- AlphaLux Cleaning historically had plumbing for a multi-account
-- Stripe setup (NY vs CA/TX). The dual-account router has been
-- removed in favor of a single Stripe account
-- (`acct_1TONej6CLM640Ljs`); see `supabase/functions/_shared/stripe-env.ts`.
--
-- The `stripe_account_slug` column is preserved at the DB level so
-- existing rows (every historical booking carries `alphalux_ny`)
-- remain intact and downstream tooling that reads the column does
-- not break. The single-account edge functions continue to write
-- `'alphalux_ny'` on every new booking. If a future expansion
-- reintroduces a second account, the column is already in place.

alter table if exists public.bookings
  add column if not exists stripe_account_slug text not null default 'alphalux_ny';

create index if not exists bookings_stripe_account_slug_idx
  on public.bookings(stripe_account_slug);

alter table if exists public.customers
  add column if not exists stripe_account_slug text;

create index if not exists customers_stripe_account_slug_idx
  on public.customers(stripe_account_slug);
