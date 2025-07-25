-- Critical Security Fixes Migration - Fix Duplicates First

-- 1. Clean up duplicate user roles - keep only the most recent one for each user
WITH ranked_roles AS (
  SELECT id, user_id, role, created_at,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
  FROM public.user_roles
)
DELETE FROM public.user_roles 
WHERE id IN (
  SELECT id FROM ranked_roles WHERE rn > 1
);

-- 2. Now add the unique constraint
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);

-- 3. Update all database functions with proper search_path for security

-- Fix validate_and_use_referral_code function
CREATE OR REPLACE FUNCTION public.validate_and_use_referral_code(p_code text, p_user_email text, p_user_name text DEFAULT NULL::text, p_order_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- Fix create_referral_code function
CREATE OR REPLACE FUNCTION public.create_referral_code(p_owner_email text, p_owner_name text DEFAULT NULL::text, p_custom_code text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- 4. Add security logging table for audit trail
CREATE TABLE IF NOT EXISTS public.security_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  resource text,
  details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on security logs
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view security logs
CREATE POLICY "Admins can view security logs" ON public.security_logs
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert security logs
CREATE POLICY "System can insert security logs" ON public.security_logs
  FOR INSERT WITH CHECK (true);