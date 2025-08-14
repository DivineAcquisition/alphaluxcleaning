-- Comprehensive Fix: Set secure search_path for ALL remaining SECURITY DEFINER functions
-- This prevents potential privilege escalation attacks

-- Fix update_updated_at_column trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix log_security_event function
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
SET search_path = ''
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

-- Fix check_suspicious_activity function
CREATE OR REPLACE FUNCTION public.check_suspicious_activity(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_failed_logins integer;
  v_admin_actions integer;
  v_result jsonb;
BEGIN
  -- Check failed login attempts in last hour
  SELECT COUNT(*) INTO v_failed_logins
  FROM public.failed_login_attempts fla
  JOIN auth.users u ON u.email = fla.email
  WHERE u.id = p_user_id
    AND fla.attempt_time > now() - interval '1 hour';
  
  -- Check admin actions in last hour
  SELECT COUNT(*) INTO v_admin_actions
  FROM public.security_audit_log
  WHERE user_id = p_user_id
    AND timestamp > now() - interval '1 hour'
    AND risk_level IN ('high', 'critical');
  
  v_result := jsonb_build_object(
    'failed_logins_last_hour', v_failed_logins,
    'high_risk_actions_last_hour', v_admin_actions,
    'is_suspicious', (v_failed_logins > 5 OR v_admin_actions > 10),
    'risk_level', CASE 
      WHEN v_failed_logins > 10 OR v_admin_actions > 20 THEN 'critical'
      WHEN v_failed_logins > 5 OR v_admin_actions > 10 THEN 'high'
      WHEN v_failed_logins > 2 OR v_admin_actions > 5 THEN 'medium'
      ELSE 'low'
    END
  );
  
  RETURN v_result;
END;
$$;

-- Fix calculate_subcontractor_tier function
CREATE OR REPLACE FUNCTION public.calculate_subcontractor_tier(p_review_count integer, p_completed_jobs integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Tier 3: 25+ reviews & 30+ completed jobs
  IF p_review_count >= 25 AND p_completed_jobs >= 30 THEN
    RETURN 3;
  -- Tier 2: 15+ reviews & 20+ completed jobs  
  ELSIF p_review_count >= 15 AND p_completed_jobs >= 20 THEN
    RETURN 2;
  -- Tier 1: Default
  ELSE
    RETURN 1;
  END IF;
END;
$$;

-- Fix get_tier_benefits function
CREATE OR REPLACE FUNCTION public.get_tier_benefits(p_tier_level integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  CASE p_tier_level
    WHEN 3 THEN
      RETURN jsonb_build_object(
        'hourly_rate', 21.00,
        'monthly_fee', 65.00,
        'tier_name', 'Premium',
        'requirements', jsonb_build_object('reviews', 25, 'jobs', 30)
      );
    WHEN 2 THEN
      RETURN jsonb_build_object(
        'hourly_rate', 18.00,
        'monthly_fee', 50.00,
        'tier_name', 'Professional',
        'requirements', jsonb_build_object('reviews', 15, 'jobs', 20)
      );
    ELSE
      RETURN jsonb_build_object(
        'hourly_rate', 16.00,
        'monthly_fee', 25.00,
        'tier_name', 'Standard',
        'requirements', jsonb_build_object('reviews', 0, 'jobs', 0)
      );
  END CASE;
END;
$$;

-- Log security fix for remaining functions
INSERT INTO public.security_logs (action, details)
VALUES (
  'remaining_security_definer_functions_search_path_fixed',
  jsonb_build_object(
    'timestamp', now(),
    'security_issue', 'mutable_search_path_in_remaining_security_definer_functions',
    'functions_fixed', ARRAY[
      'update_updated_at_column',
      'log_security_event',
      'check_suspicious_activity',
      'calculate_subcontractor_tier',
      'get_tier_benefits'
    ],
    'description', 'Fixed additional SECURITY DEFINER functions to use immutable search_path = empty string, preventing potential privilege escalation attacks.'
  )
);