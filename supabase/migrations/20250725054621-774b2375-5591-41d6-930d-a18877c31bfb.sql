-- Fix critical database function security issues by adding proper search_path

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name)
    VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'customer');
    
    RETURN NEW;
END;
$$;

-- Update has_role function
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

-- Update get_user_role function
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

-- Update validate_and_use_referral_code function
CREATE OR REPLACE FUNCTION public.validate_and_use_referral_code(p_code text, p_user_email text, p_user_name text DEFAULT NULL::text, p_order_id uuid DEFAULT NULL::uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_referral_code RECORD;
  v_existing_use RECORD;
  v_result JSONB;
BEGIN
  -- Check if referral code exists and is active
  SELECT * INTO v_referral_code 
  FROM public.referral_codes 
  WHERE code = p_code AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid or inactive referral code'
    );
  END IF;
  
  -- Check if code has expired
  IF v_referral_code.expires_at IS NOT NULL AND v_referral_code.expires_at < now() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Referral code has expired'
    );
  END IF;
  
  -- Check if user is trying to use their own referral code
  IF v_referral_code.owner_email = p_user_email THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'You cannot use your own referral code'
    );
  END IF;
  
  -- Check if user has already used this referral code
  SELECT * INTO v_existing_use 
  FROM public.referral_uses 
  WHERE referral_code_id = v_referral_code.id AND used_by_email = p_user_email;
  
  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'You have already used this referral code'
    );
  END IF;
  
  -- Check if referral code has reached max uses
  IF v_referral_code.max_uses IS NOT NULL AND v_referral_code.current_uses >= v_referral_code.max_uses THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Referral code has reached its usage limit'
    );
  END IF;
  
  -- Record the referral use
  INSERT INTO public.referral_uses (
    referral_code_id,
    used_by_email,
    used_by_name,
    order_id
  ) VALUES (
    v_referral_code.id,
    p_user_email,
    p_user_name,
    p_order_id
  );
  
  -- Update usage count
  UPDATE public.referral_codes 
  SET current_uses = current_uses + 1 
  WHERE id = v_referral_code.id;
  
  RETURN jsonb_build_object(
    'success', true,
    'reward_type', v_referral_code.reward_type,
    'owner_name', v_referral_code.owner_name,
    'message', 'Referral code applied successfully!'
  );
END;
$$;

-- Update create_referral_code function
CREATE OR REPLACE FUNCTION public.create_referral_code(p_owner_email text, p_owner_name text DEFAULT NULL::text, p_custom_code text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_code TEXT;
  v_result JSONB;
BEGIN
  -- Generate code if not provided
  IF p_custom_code IS NULL THEN
    v_code := 'REF' || upper(substring(md5(random()::text || p_owner_email), 1, 8));
  ELSE
    v_code := upper(p_custom_code);
  END IF;
  
  -- Check if code already exists
  IF EXISTS (SELECT 1 FROM public.referral_codes WHERE code = v_code) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Referral code already exists'
    );
  END IF;
  
  -- Insert new referral code
  INSERT INTO public.referral_codes (
    code,
    owner_email,
    owner_name
  ) VALUES (
    v_code,
    p_owner_email,
    p_owner_name
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'code', v_code,
    'message', 'Referral code created successfully!'
  );
END;
$$;

-- Add constraints to user_roles table for better security
ALTER TABLE public.user_roles 
ADD CONSTRAINT unique_user_role UNIQUE (user_id, role);

-- Add check constraint to prevent invalid role assignments
ALTER TABLE public.user_roles 
ADD CONSTRAINT valid_role_check CHECK (role IN ('admin', 'employee', 'customer', 'subcontractor'));