-- Add unique constraints to fix ON CONFLICT errors
ALTER TABLE public.admin_users ADD CONSTRAINT admin_users_email_unique UNIQUE (email);
ALTER TABLE public.admin_allowlist ADD CONSTRAINT admin_allowlist_email_unique UNIQUE (email);