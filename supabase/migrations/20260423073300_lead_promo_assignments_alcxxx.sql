-- Per-lead promo code assignments.
-- One row per (normalized_email) — guarantees each unique visitor gets
-- exactly one ALCxxx code across page refreshes and device swaps.
create table if not exists public.lead_promo_assignments (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  email_normalized text generated always as (lower(trim(email))) stored,
  code text not null,
  percent_off numeric not null default 50,
  first_name text,
  last_name text,
  phone text,
  zip_code text,
  city text,
  state text,
  utms jsonb,
  ghl_contact_id text,
  redeemed_booking_id uuid references public.bookings(id) on delete set null,
  redeemed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists lead_promo_assignments_email_key
  on public.lead_promo_assignments (email_normalized);
create unique index if not exists lead_promo_assignments_code_key
  on public.lead_promo_assignments (code);
create index if not exists lead_promo_assignments_ghl_contact_idx
  on public.lead_promo_assignments (ghl_contact_id);

alter table public.lead_promo_assignments enable row level security;

-- Lock down to service_role only — client code should always go through
-- the assign-lead-promo edge function.
drop policy if exists lead_promo_assignments_service_role_all
  on public.lead_promo_assignments;
create policy lead_promo_assignments_service_role_all
  on public.lead_promo_assignments
  for all
  to service_role
  using (true)
  with check (true);

-- Auto-touch updated_at.
create or replace function public.tg_lead_promo_assignments_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_lead_promo_assignments_updated_at
  on public.lead_promo_assignments;
create trigger trg_lead_promo_assignments_updated_at
  before update on public.lead_promo_assignments
  for each row execute function public.tg_lead_promo_assignments_updated_at();

-- Seed row for the shared NY/TX/CA ALC2026 code so it's traceable in
-- the same lineage as the per-customer ALCxxx codes.
insert into public.lead_promo_assignments (email, code, percent_off)
values ('ops+alc2026@alphaluxclean.com', 'ALC2026', 50)
on conflict (email_normalized) do nothing;
