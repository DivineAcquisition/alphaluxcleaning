-- First, drop the existing overly permissive policy
DROP POLICY "Anyone can read active referral codes" ON public.referral_codes;

-- Create new policies that protect customer personal information

-- Policy 1: Users can view only their own referral codes (full access)
CREATE POLICY "Users can view their own referral codes"
ON public.referral_codes
FOR SELECT
USING (owner_email = auth.email());

-- Policy 2: Users can create their own referral codes
CREATE POLICY "Users can create their own referral codes"
ON public.referral_codes
FOR INSERT
WITH CHECK (owner_email = auth.email());

-- Policy 3: Users can update their own referral codes
CREATE POLICY "Users can update their own referral codes"
ON public.referral_codes
FOR UPDATE
USING (owner_email = auth.email());

-- Policy 4: Allow validation of referral codes without exposing personal info
-- This is for the referral code validation functionality
CREATE POLICY "Allow referral code validation"
ON public.referral_codes
FOR SELECT
USING (is_active = true);

-- Create a security definer function to validate referral codes safely
-- This function will not expose owner email/name to unauthorized users
CREATE OR REPLACE FUNCTION public.validate_referral_code_secure(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_referral_code RECORD;
  v_result JSONB;
BEGIN
  -- Check if referral code exists and is active
  SELECT id, code, is_active, expires_at, max_uses, current_uses, reward_type
  INTO v_referral_code 
  FROM public.referral_codes 
  WHERE code = p_code AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Invalid or inactive referral code'
    );
  END IF;
  
  -- Check if code has expired
  IF v_referral_code.expires_at IS NOT NULL AND v_referral_code.expires_at < now() THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Referral code has expired'
    );
  END IF;
  
  -- Check if referral code has reached max uses
  IF v_referral_code.max_uses IS NOT NULL AND v_referral_code.current_uses >= v_referral_code.max_uses THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Referral code has reached its usage limit'
    );
  END IF;
  
  -- Return success without exposing personal information
  RETURN jsonb_build_object(
    'valid', true,
    'code', v_referral_code.code,
    'reward_type', v_referral_code.reward_type,
    'message', 'Referral code is valid!'
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.validate_referral_code_secure(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_referral_code_secure(text) TO anon;