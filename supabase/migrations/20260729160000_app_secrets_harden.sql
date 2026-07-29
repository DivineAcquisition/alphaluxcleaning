-- Harden app_secrets now that it holds live provider credentials.
--
-- The table was created for one key (ANTHROPIC_API_KEY) and is now the
-- store for the OpenPhone and GoHighLevel credentials as well, because
-- Supabase has no API for setting edge-function environment secrets —
-- they are dashboard-only — and these need to be settable and rotatable
-- without one.
--
-- RLS already denied anon and authenticated (no policy covers them, so
-- PostgREST returns nothing), and that was verified empirically before
-- this change: `set local role anon; select count(*) from app_secrets`
-- returned 0. But both roles still carried Supabase's default
-- table-level SELECT grant, so the protection rested entirely on RLS
-- staying enabled. One "disable RLS to debug something" would have
-- exposed every credential at once.
--
-- Revoking the grant means privileges and RLS both have to fail before
-- anything leaks. FORCE ROW LEVEL SECURITY additionally applies the
-- policy to the table owner, so a SECURITY DEFINER routine owned by
-- postgres cannot read around it by accident.

REVOKE ALL ON public.app_secrets FROM anon, authenticated;

ALTER TABLE public.app_secrets FORCE ROW LEVEL SECURITY;
