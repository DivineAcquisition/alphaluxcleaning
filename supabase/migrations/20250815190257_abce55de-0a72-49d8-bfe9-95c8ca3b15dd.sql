-- Remove the overly permissive referral codes policy
-- The problematic policy "Authenticated users can read active referral codes" allows 
-- any authenticated user to see all active referral codes, which is a security vulnerability

DROP POLICY "Authenticated users can read active referral codes" ON public.referral_codes;

-- Log the security fix
INSERT INTO public.security_logs (action, details)
VALUES (
  'removed_permissive_referral_policy',
  jsonb_build_object(
    'timestamp', now(),
    'action', 'removed_overly_permissive_policy',
    'policy_removed', 'Authenticated users can read active referral codes',
    'description', 'Removed policy that allowed any authenticated user to view all active referral codes',
    'security_impact', 'Now only users can view their own referral codes (plus admins)'
  )
);