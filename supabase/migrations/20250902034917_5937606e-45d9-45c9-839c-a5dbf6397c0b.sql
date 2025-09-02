-- PHASE 3A: CRITICAL SECURITY HARDENING - RETRY
-- Fix critical RLS policy vulnerabilities and function security

-- 1. Fix Function Search Path Security (Critical)
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

-- 2. CRITICAL: Fix Public Data Exposure
-- Remove all anonymous access and implement strict authentication

-- Fix orders table RLS (CRITICAL - Customer PII exposed)
DROP POLICY IF EXISTS "Public read access for lookup" ON public.orders;
DROP POLICY IF EXISTS "public_order_lookup" ON public.orders;
DROP POLICY IF EXISTS "orders_secure_select" ON public.orders;
DROP POLICY IF EXISTS "secure_orders_select" ON public.orders;

CREATE POLICY "secure_orders_select"
ON public.orders
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR 
  customer_email = (auth.jwt() ->> 'email'::text) OR
  has_role(auth.uid(), 'super_admin'::app_role)
);

-- Fix bookings table RLS (CRITICAL - Customer addresses exposed)
DROP POLICY IF EXISTS "Email-based customer bookings access" ON public.bookings;
DROP POLICY IF EXISTS "bookings_secure_select" ON public.bookings;
DROP POLICY IF EXISTS "secure_bookings_select" ON public.bookings;

CREATE POLICY "secure_bookings_select"
ON public.bookings
FOR SELECT
TO authenticated
USING (
  customer_email = (auth.jwt() ->> 'email'::text) OR
  (order_id IS NOT NULL AND order_id IN (
    SELECT id FROM orders WHERE user_id = auth.uid()
  )) OR
  has_role(auth.uid(), 'super_admin'::app_role)
);

-- Fix commercial_estimates table RLS (CRITICAL - Business data exposed)
DROP POLICY IF EXISTS "Anyone can submit commercial estimates" ON public.commercial_estimates;
DROP POLICY IF EXISTS "commercial_estimates_secure_select" ON public.commercial_estimates;
DROP POLICY IF EXISTS "secure_commercial_estimates_select" ON public.commercial_estimates;
DROP POLICY IF EXISTS "secure_commercial_estimates_insert" ON public.commercial_estimates;

CREATE POLICY "secure_commercial_estimates_select"
ON public.commercial_estimates
FOR SELECT
TO authenticated
USING (
  email = (auth.jwt() ->> 'email'::text) OR
  user_id = auth.uid() OR
  has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "secure_commercial_estimates_insert"
ON public.commercial_estimates
FOR INSERT
TO authenticated
WITH CHECK (
  email IS NOT NULL AND email <> ''
);

-- Fix referral_codes table RLS (CRITICAL - Email harvesting)
DROP POLICY IF EXISTS "Active referral codes are publicly readable" ON public.referral_codes;
DROP POLICY IF EXISTS "secure_referral_codes_select" ON public.referral_codes;

CREATE POLICY "secure_referral_codes_select"
ON public.referral_codes
FOR SELECT
TO authenticated
USING (
  owner_user_id = auth.uid() OR
  (is_active = true AND expires_at > now()) OR
  has_role(auth.uid(), 'super_admin'::app_role)
);

-- 3. Fix System Tables - Remove Anonymous Access
-- Auth rate limits - system only
DROP POLICY IF EXISTS "System manages rate limits" ON public.auth_rate_limits;
DROP POLICY IF EXISTS "secure_auth_rate_limits" ON public.auth_rate_limits;

CREATE POLICY "secure_auth_rate_limits"
ON public.auth_rate_limits
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Domain routing - authenticated users only
DROP POLICY IF EXISTS "Public can view active domain routing" ON public.domain_routing_config;
DROP POLICY IF EXISTS "secure_domain_routing_select" ON public.domain_routing_config;

CREATE POLICY "secure_domain_routing_select"
ON public.domain_routing_config
FOR SELECT
TO authenticated
USING (is_active = true);

-- 4. Add Enhanced Rate Limiting Table
CREATE TABLE IF NOT EXISTS public.enhanced_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  identifier_type text NOT NULL CHECK (identifier_type IN ('email', 'user_id', 'ip_address')),
  action_type text NOT NULL,
  bucket_start timestamp with time zone NOT NULL DEFAULT date_trunc('hour', now()),
  attempt_count integer NOT NULL DEFAULT 1,
  max_attempts integer NOT NULL DEFAULT 10,
  window_minutes integer NOT NULL DEFAULT 60,
  blocked_until timestamp with time zone,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  UNIQUE(identifier, identifier_type, action_type, bucket_start)
);

ALTER TABLE public.enhanced_rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "secure_enhanced_rate_limits" ON public.enhanced_rate_limits;
CREATE POLICY "secure_enhanced_rate_limits"
ON public.enhanced_rate_limits
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 5. Enhanced Rate Limiting Function
CREATE OR REPLACE FUNCTION public.check_enhanced_rate_limit(
  p_identifier text,
  p_identifier_type text,
  p_action_type text,
  p_max_attempts integer DEFAULT 10,
  p_window_minutes integer DEFAULT 60
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_bucket_start timestamp with time zone := date_trunc('hour', now());
  v_row record;
  v_block_duration interval := '15 minutes';
BEGIN
  INSERT INTO public.enhanced_rate_limits (
    identifier, identifier_type, action_type, bucket_start, 
    max_attempts, window_minutes
  )
  VALUES (p_identifier, p_identifier_type, p_action_type, v_bucket_start, p_max_attempts, p_window_minutes)
  ON CONFLICT (identifier, identifier_type, action_type, bucket_start)
  DO UPDATE SET 
    attempt_count = enhanced_rate_limits.attempt_count + 1,
    updated_at = now();

  SELECT * INTO v_row
  FROM public.enhanced_rate_limits
  WHERE identifier = p_identifier 
    AND identifier_type = p_identifier_type 
    AND action_type = p_action_type 
    AND bucket_start = v_bucket_start;

  IF v_row.blocked_until IS NOT NULL AND v_row.blocked_until > now() THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'currently_blocked',
      'blocked_until', v_row.blocked_until,
      'attempt_count', v_row.attempt_count
    );
  END IF;

  IF v_row.attempt_count >= p_max_attempts THEN
    UPDATE public.enhanced_rate_limits
    SET blocked_until = now() + v_block_duration,
        metadata = metadata || jsonb_build_object('blocked_at', now())
    WHERE id = v_row.id;

    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'rate_limited',
      'blocked_until', now() + v_block_duration,
      'attempt_count', v_row.attempt_count
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'reason', 'allowed',
    'attempt_count', v_row.attempt_count,
    'remaining_attempts', p_max_attempts - v_row.attempt_count
  );
END;
$$;