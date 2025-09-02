-- PHASE 3A: CRITICAL SECURITY HARDENING
-- Fix critical RLS policy vulnerabilities and function security

-- 1. Fix Function Search Path Security (Critical)
-- Update all functions to have immutable search_path
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

  -- Log admin access attempts for security monitoring
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
        'admin_verified', v_is_admin
      ),
      NULL,
      NULL,
      CASE WHEN v_is_admin THEN 'low' ELSE 'high' END
    );
  END IF;

  RETURN v_is_admin;
END;
$$;

-- 2. CRITICAL: Fix Public Data Exposure
-- Remove all anonymous access and implement strict authentication

-- Fix orders table RLS (CRITICAL - Customer PII exposed)
DROP POLICY IF EXISTS "Public read access for lookup" ON public.orders;
DROP POLICY IF EXISTS "public_order_lookup" ON public.orders;
DROP POLICY IF EXISTS "orders_secure_select" ON public.orders;

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

CREATE POLICY "secure_auth_rate_limits"
ON public.auth_rate_limits
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Webhook queue - system only
CREATE POLICY "secure_webhook_queue"
ON public.webhook_queue
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Domain routing - authenticated users only
DROP POLICY IF EXISTS "Public can view active domain routing" ON public.domain_routing_config;

CREATE POLICY "secure_domain_routing_select"
ON public.domain_routing_config
FOR SELECT
TO authenticated
USING (is_active = true);

-- 4. Add Enhanced Rate Limiting Table
CREATE TABLE IF NOT EXISTS public.enhanced_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL, -- email, user_id, or IP
  identifier_type text NOT NULL CHECK (identifier_type IN ('email', 'user_id', 'ip_address')),
  action_type text NOT NULL, -- 'auth', 'api', 'sms', 'payment'
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

-- Enable RLS on enhanced rate limits
ALTER TABLE public.enhanced_rate_limits ENABLE ROW LEVEL SECURITY;

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
  -- Insert new bucket or increment existing
  INSERT INTO public.enhanced_rate_limits (
    identifier, identifier_type, action_type, bucket_start, 
    max_attempts, window_minutes
  )
  VALUES (p_identifier, p_identifier_type, p_action_type, v_bucket_start, p_max_attempts, p_window_minutes)
  ON CONFLICT (identifier, identifier_type, action_type, bucket_start)
  DO UPDATE SET 
    attempt_count = enhanced_rate_limits.attempt_count + 1,
    updated_at = now();

  -- Get current state
  SELECT * INTO v_row
  FROM public.enhanced_rate_limits
  WHERE identifier = p_identifier 
    AND identifier_type = p_identifier_type 
    AND action_type = p_action_type 
    AND bucket_start = v_bucket_start;

  -- Check if currently blocked
  IF v_row.blocked_until IS NOT NULL AND v_row.blocked_until > now() THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'currently_blocked',
      'blocked_until', v_row.blocked_until,
      'attempt_count', v_row.attempt_count
    );
  END IF;

  -- Block if too many attempts
  IF v_row.attempt_count >= p_max_attempts THEN
    UPDATE public.enhanced_rate_limits
    SET blocked_until = now() + v_block_duration,
        metadata = metadata || jsonb_build_object('blocked_at', now())
    WHERE id = v_row.id;

    -- Log security event for rate limiting
    PERFORM public.log_security_event(
      CASE WHEN p_identifier_type = 'user_id' THEN p_identifier::uuid ELSE NULL END,
      'rate_limit_exceeded',
      p_action_type,
      p_identifier,
      NULL,
      jsonb_build_object(
        'identifier', p_identifier,
        'identifier_type', p_identifier_type,
        'action_type', p_action_type,
        'attempt_count', v_row.attempt_count,
        'blocked_until', now() + v_block_duration
      ),
      NULL,
      NULL,
      'high'
    );

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

-- 6. IP Geolocation and Threat Detection
CREATE TABLE IF NOT EXISTS public.ip_threat_intelligence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address inet NOT NULL UNIQUE,
  country_code text,
  is_vpn boolean DEFAULT false,
  is_tor boolean DEFAULT false,
  is_proxy boolean DEFAULT false,
  threat_score integer DEFAULT 0 CHECK (threat_score >= 0 AND threat_score <= 100),
  reputation_sources jsonb DEFAULT '[]',
  first_seen timestamp with time zone DEFAULT now(),
  last_updated timestamp with time zone DEFAULT now(),
  is_blocked boolean DEFAULT false,
  block_reason text,
  metadata jsonb DEFAULT '{}'
);

ALTER TABLE public.ip_threat_intelligence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "secure_ip_threat_intelligence"
ON public.ip_threat_intelligence
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 7. Security Event Triggers
CREATE OR REPLACE FUNCTION public.trigger_security_monitoring()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Monitor high-risk security events
  IF NEW.risk_level IN ('high', 'critical') THEN
    -- Could trigger external alerting here
    INSERT INTO public.security_alerts (
      event_id,
      alert_type,
      severity,
      title,
      description,
      metadata
    ) VALUES (
      NEW.id,
      'high_risk_event',
      NEW.risk_level,
      'High Risk Security Event Detected',
      'Action: ' || NEW.action_type || ' on ' || NEW.resource_type,
      jsonb_build_object(
        'user_id', NEW.user_id,
        'action', NEW.action_type,
        'resource', NEW.resource_type,
        'timestamp', NEW.timestamp
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create security alerts table if not exists
CREATE TABLE IF NOT EXISTS public.security_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.security_audit_log(id),
  alert_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title text NOT NULL,
  description text,
  status text DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')),
  assigned_to uuid,
  resolved_at timestamp with time zone,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "secure_security_alerts_select"
ON public.security_alerts
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "secure_security_alerts_manage"
ON public.security_alerts
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add trigger to security_audit_log
DROP TRIGGER IF EXISTS security_monitoring_trigger ON public.security_audit_log;
CREATE TRIGGER security_monitoring_trigger
  AFTER INSERT ON public.security_audit_log
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_security_monitoring();

-- 8. Update existing functions with proper search paths
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id uuid, 
  p_action_type text, 
  p_resource_type text, 
  p_resource_id text DEFAULT NULL::text, 
  p_old_values jsonb DEFAULT NULL::jsonb, 
  p_new_values jsonb DEFAULT NULL::jsonb, 
  p_ip_address inet DEFAULT NULL::inet, 
  p_user_agent text DEFAULT NULL::text, 
  p_risk_level text DEFAULT 'low'::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO public.security_audit_log (
    user_id,
    action_type,
    resource_type,
    resource_id,
    old_values,
    new_values,
    ip_address,
    user_agent,
    risk_level
  ) VALUES (
    p_user_id,
    p_action_type,
    p_resource_type,
    p_resource_id,
    p_old_values,
    p_new_values,
    p_ip_address,
    p_user_agent,
    p_risk_level
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;