-- Fix referral codes security vulnerability
-- Ensure only users can see their own referral codes

-- First, check what policies currently exist and drop them all
DO $$
BEGIN
    -- Drop all existing policies on referral_codes to start clean
    DROP POLICY IF EXISTS "Anyone can read active referral codes" ON public.referral_codes;
    DROP POLICY IF EXISTS "Users can view their own referral codes" ON public.referral_codes;
    DROP POLICY IF EXISTS "Users can create their own referral codes" ON public.referral_codes;
    DROP POLICY IF EXISTS "Users can update their own referral codes" ON public.referral_codes;
    DROP POLICY IF EXISTS "Users can view own referral codes" ON public.referral_codes;
    DROP POLICY IF EXISTS "Authenticated users can create referral codes" ON public.referral_codes;
    DROP POLICY IF EXISTS "Users can update own referral codes" ON public.referral_codes;
END $$;

-- Ensure RLS is enabled
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

-- Create secure policies that only allow users to access their own referral codes
CREATE POLICY "Users can only view their own referral codes" 
ON public.referral_codes 
FOR SELECT 
USING (
  owner_email = (SELECT email FROM auth.users WHERE id = auth.uid()) 
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Users can only create their own referral codes" 
ON public.referral_codes 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND owner_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

CREATE POLICY "Users can only update their own referral codes" 
ON public.referral_codes 
FOR UPDATE 
USING (
  owner_email = (SELECT email FROM auth.users WHERE id = auth.uid()) 
  OR has_role(auth.uid(), 'super_admin'::app_role)
)
WITH CHECK (
  owner_email = (SELECT email FROM auth.users WHERE id = auth.uid()) 
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Admins can delete referral codes" 
ON public.referral_codes 
FOR DELETE 
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Log the security fix
INSERT INTO public.security_logs (action, details)
VALUES (
  'referral_codes_security_fix',
  jsonb_build_object(
    'timestamp', now(),
    'action', 'fixed_referral_codes_exposure',
    'description', 'Secured referral_codes table so users can only access their own codes',
    'security_level', 'critical_fix'
  )
);