-- Security fixes: Tighten RLS policies to require authentication

-- Fix anonymous access policies for critical tables
-- 1. Commercial estimates - require authentication for all operations
DROP POLICY IF EXISTS "Anyone can insert commercial estimates" ON public.commercial_estimates;
CREATE POLICY "Authenticated users can insert commercial estimates" ON public.commercial_estimates
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- 2. Bookings - ensure only authenticated users can access
ALTER TABLE public.bookings DROP POLICY IF EXISTS "System can insert bookings";
CREATE POLICY "Authenticated users can insert bookings" ON public.bookings
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- 3. Order tips - secure against anonymous access
ALTER TABLE public.order_tips DROP POLICY IF EXISTS "Authenticated users can insert tips";
CREATE POLICY "Verified users can insert tips" ON public.order_tips
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND auth.role() = 'authenticated');

-- 4. Referral codes - limit anonymous reading
ALTER TABLE public.referral_codes DROP POLICY IF EXISTS "Anyone can read active referral codes";
CREATE POLICY "Authenticated users can read active referral codes" ON public.referral_codes
FOR SELECT 
USING (auth.uid() IS NOT NULL AND is_active = true);

-- 5. Referral uses - secure insertion
ALTER TABLE public.referral_uses DROP POLICY IF EXISTS "Anyone can insert referral uses";
CREATE POLICY "Authenticated users can insert referral uses" ON public.referral_uses
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- 6. Enhance admin access logging with proper security
CREATE OR REPLACE FUNCTION public.enhanced_admin_verification()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_is_admin boolean := false;
BEGIN
  -- Verify admin role exists
  SELECT EXISTS(
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'::app_role
  ) INTO v_is_admin;
  
  -- Log all admin access attempts
  IF auth.uid() IS NOT NULL THEN
    PERFORM public.log_security_event(
      auth.uid(),
      CASE WHEN v_is_admin THEN 'admin_access_granted' ELSE 'admin_access_denied' END,
      'admin_verification',
      NULL,
      NULL,
      jsonb_build_object(
        'timestamp', now(),
        'user_id', auth.uid(),
        'ip_address', current_setting('request.headers', true)::jsonb->>'x-forwarded-for'
      ),
      NULL,
      NULL,
      CASE WHEN v_is_admin THEN 'low' ELSE 'high' END
    );
  END IF;
  
  RETURN v_is_admin;
END;
$$;

-- 7. Create secure admin policies for sensitive tables
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

-- 8. Add rate limiting for authentication attempts
CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address inet NOT NULL,
  email text,
  attempt_count integer DEFAULT 1,
  last_attempt timestamp with time zone DEFAULT now(),
  blocked_until timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on rate limits table
ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only system can manage rate limits
CREATE POLICY "System manages rate limits" ON public.auth_rate_limits
FOR ALL USING (false) WITH CHECK (false);

-- 9. Create function to check and log authentication attempts
CREATE OR REPLACE FUNCTION public.check_auth_rate_limit(p_email text, p_ip_address inet DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_attempt_count integer := 0;
  v_blocked_until timestamp with time zone;
  v_current_time timestamp with time zone := now();
BEGIN
  -- Check current rate limit status
  SELECT attempt_count, blocked_until
  INTO v_attempt_count, v_blocked_until
  FROM public.auth_rate_limits
  WHERE email = p_email 
    AND created_at > v_current_time - interval '1 hour'
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Check if currently blocked
  IF v_blocked_until IS NOT NULL AND v_blocked_until > v_current_time THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'rate_limited',
      'blocked_until', v_blocked_until,
      'attempt_count', v_attempt_count
    );
  END IF;
  
  -- Increment attempt counter
  INSERT INTO public.auth_rate_limits (email, ip_address, attempt_count)
  VALUES (p_email, p_ip_address, COALESCE(v_attempt_count, 0) + 1)
  ON CONFLICT (email) WHERE created_at > v_current_time - interval '1 hour'
  DO UPDATE SET 
    attempt_count = auth_rate_limits.attempt_count + 1,
    last_attempt = v_current_time,
    blocked_until = CASE 
      WHEN auth_rate_limits.attempt_count >= 5 THEN v_current_time + interval '15 minutes'
      ELSE NULL
    END;
  
  -- Return current status
  RETURN jsonb_build_object(
    'allowed', COALESCE(v_attempt_count, 0) < 5,
    'reason', CASE WHEN COALESCE(v_attempt_count, 0) >= 5 THEN 'max_attempts_exceeded' ELSE 'allowed' END,
    'attempt_count', COALESCE(v_attempt_count, 0) + 1
  );
END;
$$;