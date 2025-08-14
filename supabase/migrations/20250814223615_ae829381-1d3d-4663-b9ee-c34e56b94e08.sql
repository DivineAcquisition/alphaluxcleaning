-- Fix Critical Security Issue: Referral Uses Data Harvesting Protection
-- Issue: referral_uses table allows public read access to customer emails and names

-- Drop the overly permissive policy that allows anyone to view referral uses
DROP POLICY IF EXISTS "Users can view referral uses for their codes" ON public.referral_uses;

-- Drop the existing policy on referral_codes that might be too permissive
DROP POLICY IF EXISTS "Anyone can read active referral codes" ON public.referral_codes;

-- Create secure policy for referral_uses - only referral code owners can see uses of their codes
CREATE POLICY "Referral code owners can view uses of their codes" 
ON public.referral_uses 
FOR SELECT 
TO authenticated
USING (
  referral_code_id IN (
    SELECT id FROM public.referral_codes 
    WHERE owner_email = auth.email()
  )
);

-- Create admin policy for referral_uses management
CREATE POLICY "Admins can manage all referral uses" 
ON public.referral_uses 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Update referral_codes policy to be more secure - only active codes visible to authenticated users
CREATE POLICY "Authenticated users can read active referral codes" 
ON public.referral_codes 
FOR SELECT 
TO authenticated
USING (is_active = true);

-- Ensure existing policies are secure - update the view policy for referral codes
DROP POLICY IF EXISTS "Users can view their own referral codes" ON public.referral_codes;
CREATE POLICY "Users can view their own referral codes" 
ON public.referral_codes 
FOR SELECT 
TO authenticated
USING (owner_email = auth.email());

-- Log this critical security fix
INSERT INTO public.security_logs (action, details)
VALUES (
  'referral_data_security_fix',
  jsonb_build_object(
    'timestamp', now(),
    'issue', 'Customer referral data could be harvested by spammers',
    'changes', jsonb_build_array(
      'Restricted referral_uses table access to referral code owners and admins only',
      'Removed public read access to customer emails and names in referral data',
      'Updated referral_codes policies to require authentication'
    ),
    'security_level', 'critical_fix',
    'impact', 'Prevented potential customer data harvesting by spammers'
  )
);