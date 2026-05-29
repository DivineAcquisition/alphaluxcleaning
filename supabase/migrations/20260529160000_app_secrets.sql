-- Service-role-only key/value store for runtime secrets that edge functions
-- can read when a platform env var isn't set. Lets us manage secrets like
-- ANTHROPIC_API_KEY without the Supabase dashboard, and survives function
-- redeploys (the value lives in the DB, never in code or git).
--
-- NOTE: secret *values* are inserted out-of-band (never committed here).
create table if not exists public.app_secrets (
  name text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table public.app_secrets enable row level security;

-- Only the service role may read/write. The anon/auth roles have no policy,
-- so PostgREST denies them outright.
drop policy if exists app_secrets_service_role_all on public.app_secrets;
create policy app_secrets_service_role_all
  on public.app_secrets
  for all
  to service_role
  using (true)
  with check (true);
