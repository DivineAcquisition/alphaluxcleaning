-- Secure admin creation functions and fix security warnings

-- 1. Disable the dangerous create-test-admin function by replacing it with a secure version
CREATE OR REPLACE FUNCTION public.create_test_admin_secure()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log the attempt for security monitoring
  INSERT INTO public.security_logs (action, details)
  VALUES (
    'admin_creation_attempt_blocked',
    jsonb_build_object('timestamp', now(), 'message', 'Admin creation function disabled for security')
  );
  
  RETURN jsonb_build_object(
    'success', false,
    'error', 'Admin creation has been disabled for security. Use Supabase Auth dashboard to create admin users.'
  );
END;
$$;

-- 2. Fix the dangerous fix-admin-users function
CREATE OR REPLACE FUNCTION public.fix_admin_users_secure()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.security_logs (action, details)
  VALUES (
    'admin_fix_attempt_blocked',
    jsonb_build_object('timestamp', now(), 'message', 'Admin fix function disabled for security')
  );
  
  RETURN jsonb_build_object(
    'success', false,
    'error', 'Admin user management has been disabled for security. Use Supabase Auth dashboard instead.'
  );
END;
$$;

-- 3. Fix function search paths for security (addressing the linter warning)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- 4. Fix other functions with search path issues
CREATE OR REPLACE FUNCTION public.validate_referral_code_secure(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_referral_record RECORD;
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