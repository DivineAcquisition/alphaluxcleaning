-- Fix critical security issue: Ensure admin_otp_codes is not publicly readable
-- The existing "Service role can manage admin OTP codes" policy is correct,
-- but we need to ensure no other access is possible

-- Verify RLS is enabled (should already be enabled)
ALTER TABLE public.admin_otp_codes ENABLE ROW LEVEL SECURITY;

-- Drop any overly permissive policies if they exist
DROP POLICY IF EXISTS "Allow public read" ON public.admin_otp_codes;
DROP POLICY IF EXISTS "Allow anonymous access" ON public.admin_otp_codes;

-- Ensure only service role can access admin OTP codes
-- The existing policy "Service role can manage admin OTP codes" should remain
-- Add an explicit deny policy for all other users
CREATE POLICY "Block all non-service-role access to admin OTP codes"
ON public.admin_otp_codes
FOR ALL
TO authenticated, anon
USING (false)
WITH CHECK (false);