-- Create unique index on admin_allowlist email to support deterministic upserts
CREATE UNIQUE INDEX IF NOT EXISTS admin_allowlist_email_key ON public.admin_allowlist (email);