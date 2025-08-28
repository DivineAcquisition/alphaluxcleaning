
-- 1) Secure storage for subcontractor SSN (last4 + salted hash)
-- IMPORTANT: We do NOT store raw SSN to reduce risk.
create table if not exists public.subcontractor_sensitive (
  id uuid primary key default gen_random_uuid(),
  subcontractor_id uuid not null references public.subcontractors(id) on delete cascade,
  ssn_last4 text not null,
  ssn_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subcontractor_id)
);

alter table public.subcontractor_sensitive enable row level security;

-- Only super_admins can manage this table
drop policy if exists "Admins can manage subcontractor_sensitive" on public.subcontractor_sensitive;

create policy "Admins can manage subcontractor_sensitive"
on public.subcontractor_sensitive
for all
to authenticated
using (has_role(auth.uid(), 'super_admin'::app_role))
with check (has_role(auth.uid(), 'super_admin'::app_role));

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_subcontractor_sensitive_updated_at on public.subcontractor_sensitive;

create trigger trg_subcontractor_sensitive_updated_at
before update on public.subcontractor_sensitive
for each row execute function public.set_updated_at();

-- 2) Clean up legacy application data
-- Remove tokens first (they reference applications), then applications
delete from public.subcontractor_onboarding_tokens;
delete from public.subcontractor_applications;
