-- Fix function search path security warning
CREATE OR REPLACE FUNCTION public.get_customer_order_status_secure(p_order_id uuid, p_customer_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_order_status jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id', o.id,
    'status', o.status,
    'created_at', o.created_at,
    'scheduled_date', o.scheduled_date,
    'service_type', o.service_details->>'service_type'
  ) INTO v_order_status
  FROM public.orders o
  WHERE o.id = p_order_id 
    AND (
      o.customer_email = p_customer_email 
      OR o.user_id = auth.uid()
      OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    );
  
  RETURN COALESCE(v_order_status, '{"error": "Order not found or access denied"}'::jsonb);
END;
$$;

-- Update existing functions with secure search paths
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
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
RETURNS public.app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Create enhanced security monitoring function
CREATE OR REPLACE FUNCTION public.log_security_event_enhanced(
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

-- Log the security improvements
INSERT INTO public.security_logs (action, details)
VALUES (
  'function_security_hardening',
  jsonb_build_object(
    'timestamp', now(),
    'action', 'Fixed function search paths and enhanced security',
    'functions_updated', ARRAY['get_customer_order_status_secure', 'has_role', 'get_user_role', 'log_security_event_enhanced']
  )
);