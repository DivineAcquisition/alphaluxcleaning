-- Security fixes: Complete RLS tightening with correct syntax

-- Drop permissive anonymous policies
DROP POLICY IF EXISTS "Anyone can insert commercial estimates" ON public.commercial_estimates;
DROP POLICY IF EXISTS "Anyone can view commercial estimates" ON public.commercial_estimates;
DROP POLICY IF EXISTS "System can insert bookings" ON public.bookings;
DROP POLICY IF EXISTS "Anyone can read active referral codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Anyone can insert referral uses" ON public.referral_uses;
DROP POLICY IF EXISTS "Authenticated users can insert tips" ON public.order_tips;

-- Create secure authenticated-only policies
CREATE POLICY "Authenticated users can insert commercial estimates" ON public.commercial_estimates
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert bookings" ON public.bookings
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can read active referral codes" ON public.referral_codes
FOR SELECT
USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "Authenticated users can insert referral uses" ON public.referral_uses
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Verified users can insert tips" ON public.order_tips
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.role() = 'authenticated');

-- Enhanced admin verification function
CREATE OR REPLACE FUNCTION public.enhanced_admin_verification()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_is_admin boolean := false;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
      AND role = 'super_admin'::app_role
  ) INTO v_is_admin;

  -- Log attempt for security monitoring
  IF auth.uid() IS NOT NULL THEN
    PERFORM public.log_security_event(
      auth.uid(),
      CASE WHEN v_is_admin THEN 'admin_access_granted' ELSE 'admin_access_denied' END,
      'admin_verification',
      NULL,
      NULL,
      jsonb_build_object('timestamp', now()),
      NULL,
      NULL,
      CASE WHEN v_is_admin THEN 'low' ELSE 'high' END
    );
  END IF;

  RETURN v_is_admin;
END;
$$;

-- Secure admin policies for sensitive tables
DROP POLICY IF EXISTS "Admins can manage companies" ON public.companies;
CREATE POLICY "Verified admins can manage companies" ON public.companies
FOR ALL
USING (public.enhanced_admin_verification())
WITH CHECK (public.enhanced_admin_verification());

DROP POLICY IF EXISTS "Admins can manage contracts" ON public.contracts;
CREATE POLICY "Verified admins can manage contracts" ON public.contracts
FOR ALL 
USING (public.enhanced_admin_verification())
WITH CHECK (public.enhanced_admin_verification());

-- Rate limiting table for authentication
CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address inet NOT NULL,
  email text NOT NULL,
  attempt_count integer NOT NULL DEFAULT 1,
  last_attempt timestamp with time zone NOT NULL DEFAULT now(),
  blocked_until timestamp with time zone,
  bucket_start timestamp with time zone NOT NULL DEFAULT date_trunc('hour', now()),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT auth_rate_limits_unique UNIQUE (email, ip_address, bucket_start)
);

ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;

-- System-only access to rate limits
CREATE POLICY "System manages rate limits" ON public.auth_rate_limits
FOR ALL USING (false) WITH CHECK (false);

-- Rate limiting function
CREATE OR REPLACE FUNCTION public.check_auth_rate_limit(p_email text, p_ip_address inet)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_bucket_start timestamp with time zone := date_trunc('hour', now());
  v_row record;
BEGIN
  -- Insert or update rate limit counter
  INSERT INTO public.auth_rate_limits (email, ip_address, bucket_start)
  VALUES (p_email, p_ip_address, v_bucket_start)
  ON CONFLICT (email, ip_address, bucket_start)
  DO UPDATE SET 
    attempt_count = public.auth_rate_limits.attempt_count + 1,
    last_attempt = now();

  -- Get current state
  SELECT * INTO v_row
  FROM public.auth_rate_limits
  WHERE email = p_email AND ip_address = p_ip_address AND bucket_start = v_bucket_start;

  -- Block after 5 attempts
  IF v_row.attempt_count >= 5 THEN
    UPDATE public.auth_rate_limits
    SET blocked_until = now() + interval '15 minutes'
    WHERE id = v_row.id;

    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'rate_limited',
      'blocked_until', now() + interval '15 minutes',
      'attempt_count', v_row.attempt_count
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'reason', 'allowed',
    'attempt_count', v_row.attempt_count
  );
END;
$$;