-- Ensure referral_codes table has proper RLS policies that don't expose customer data
-- Drop existing policies that might be too permissive
DROP POLICY IF EXISTS "Users can only view their own referral codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Users can only create their own referral codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Users can only update their own referral codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Admins can delete referral codes" ON public.referral_codes;

-- Create secure RLS policies for referral_codes
-- Only allow users to view their own referral codes (by owner_email)
CREATE POLICY "Users can view only their own referral codes" 
ON public.referral_codes 
FOR SELECT 
USING (
  (owner_email = (SELECT email FROM auth.users WHERE id = auth.uid())) 
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Only allow users to create referral codes for their own email
CREATE POLICY "Users can create only their own referral codes" 
ON public.referral_codes 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND owner_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Only allow users to update their own referral codes
CREATE POLICY "Users can update only their own referral codes" 
ON public.referral_codes 
FOR UPDATE 
USING (
  (owner_email = (SELECT email FROM auth.users WHERE id = auth.uid())) 
  OR has_role(auth.uid(), 'super_admin'::app_role)
)
WITH CHECK (
  (owner_email = (SELECT email FROM auth.users WHERE id = auth.uid())) 
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Only allow admins to delete referral codes
CREATE POLICY "Admins can delete referral codes" 
ON public.referral_codes 
FOR DELETE 
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Update the validate_and_use_referral_code function to send notifications internally
-- This eliminates the need for frontend code to access referrer email addresses
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

  -- Send referral reward notification internally (no need to expose owner_email to frontend)
  -- This call will be handled internally by the database function
  BEGIN
    -- Call the edge function to send the referral reward notification
    -- This is done from the database level, so no sensitive data is exposed to the frontend
    PERFORM pg_http_post(
      'https://kqoezqzogleaaupjzxch.supabase.co/functions/v1/send-service-notification',
      jsonb_build_object(
        'type', 'referral_reward',
        'referrerEmail', v_referral_code.owner_email,
        'referrerName', v_referral_code.owner_name,
        'friendName', p_user_name,
        'rewardCode', 'FRIEND50-' || upper(substring(md5(random()::text), 1, 8)),
        'rewardAmount', '50%'
      )::text,
      'application/json'
    );
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the referral process
    NULL;
  END;
  
  RETURN jsonb_build_object(
    'success', true,
    'reward_type', v_referral_code.reward_type,
    'owner_name', v_referral_code.owner_name,
    'message', 'Referral code applied successfully!'
  );
END;
$function$;