-- Fix critical security vulnerability in referral_codes table - again!

-- Remove the dangerous public read policy that exposes customer email addresses
DROP POLICY IF EXISTS "Anyone can read active referral codes" ON public.referral_codes;

-- Create secure policy - users can only view their own referral codes
CREATE POLICY "Users can view their own referral codes"
ON public.referral_codes
FOR SELECT
TO authenticated
USING (owner_email = auth.email());

-- Create a secure function for referral code validation that doesn't expose owner information
CREATE OR REPLACE FUNCTION public.validate_referral_code_secure(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_referral_record RECORD;
  v_result jsonb;
BEGIN
  -- Check if referral code exists and is active without exposing owner info
  SELECT 
    id,
    is_active,
    expires_at,
    max_uses,
    current_uses,
    reward_type
  INTO v_referral_record
  FROM public.referral_codes 
  WHERE code = p_code;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid referral code'
    );
  END IF;
  
  -- Check if code is active
  IF NOT v_referral_record.is_active THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Referral code is not active'
    );
  END IF;
  
  -- Check if code has expired
  IF v_referral_record.expires_at IS NOT NULL AND v_referral_record.expires_at < now() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Referral code has expired'
    );
  END IF;
  
  -- Check if code has reached max uses
  IF v_referral_record.max_uses IS NOT NULL AND v_referral_record.current_uses >= v_referral_record.max_uses THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Referral code has reached its usage limit'
    );
  END IF;
  
  -- Return success without exposing owner information
  RETURN jsonb_build_object(
    'success', true,
    'reward_type', v_referral_record.reward_type,
    'message', 'Valid referral code!'
  );
END;
$$;

-- Grant execute permissions for the secure validation function
GRANT EXECUTE ON FUNCTION public.validate_referral_code_secure(text) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_referral_code_secure(text) TO authenticated;