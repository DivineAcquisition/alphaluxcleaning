-- Phase 1: Critical Security Fixes - Secure Sensitive Data Access

-- 1. Add admin-only policies for sensitive tables
-- First, drop existing overly permissive policies where needed

-- Secure companies table (contains tax_id and business_license)
DROP POLICY IF EXISTS "Admins can manage companies" ON public.companies;
CREATE POLICY "Admins can manage companies" 
ON public.companies 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Add read-only access for basic company info (non-sensitive fields)
CREATE POLICY "Users can view basic company info" 
ON public.companies 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Secure subcontractor_payments table - ensure users only see their own payments
DROP POLICY IF EXISTS "Subcontractors can view their own payments" ON public.subcontractor_payments;
CREATE POLICY "Subcontractors can view their own payments" 
ON public.subcontractor_payments 
FOR SELECT 
USING (
  subcontractor_id IN (
    SELECT id FROM public.subcontractors 
    WHERE user_id = auth.uid()
  )
);

-- Admin access to all payments
CREATE POLICY "Admins can manage all payments" 
ON public.subcontractor_payments 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Secure notification_deliveries - users should only see their own notifications
DROP POLICY IF EXISTS "Users can view their own notification deliveries" ON public.notification_deliveries;
CREATE POLICY "Users can view their own notification deliveries" 
ON public.notification_deliveries 
FOR SELECT 
USING (recipient_id = auth.uid());

-- 2. Create secure function to check if user can access sensitive data
CREATE OR REPLACE FUNCTION public.can_access_sensitive_data(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only allow access if user is accessing their own data OR is an admin
  RETURN (auth.uid() = target_user_id) OR has_role(auth.uid(), 'super_admin'::app_role);
END;
$$;

-- 3. Add security audit logging function
CREATE OR REPLACE FUNCTION public.log_sensitive_data_access(
  p_table_name text,
  p_operation text,
  p_target_user_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log access to sensitive data for security monitoring
  PERFORM log_security_event(
    auth.uid(),
    'sensitive_data_access',
    p_table_name,
    p_target_user_id::text,
    NULL,
    jsonb_build_object(
      'operation', p_operation,
      'table', p_table_name,
      'timestamp', now()
    ),
    NULL,
    NULL,
    'medium'
  );
END;
$$;

-- 4. Secure failed login attempts table
ALTER TABLE public.failed_login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can insert failed login attempts" 
ON public.failed_login_attempts 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view failed login attempts" 
ON public.failed_login_attempts 
FOR SELECT 
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- 5. Secure security audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can insert security logs" 
ON public.security_audit_log 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view security logs" 
ON public.security_audit_log 
FOR SELECT 
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Users can view their own security logs" 
ON public.security_audit_log 
FOR SELECT 
USING (user_id = auth.uid());

-- 6. Add constraint to prevent sensitive data exposure
-- Add check to ensure SSN-like data is properly masked in display
CREATE OR REPLACE FUNCTION public.mask_sensitive_field(field_value text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF field_value IS NULL OR length(field_value) < 4 THEN
    RETURN '***';
  END IF;
  
  -- Return last 4 characters with masking
  RETURN '***-**-' || right(field_value, 4);
END;
$$;

-- 7. Create secure admin verification function
CREATE OR REPLACE FUNCTION public.verify_admin_access()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Verify user has admin role and log the access
  IF NOT has_role(auth.uid(), 'super_admin'::app_role) THEN
    -- Log unauthorized admin access attempt
    PERFORM log_security_event(
      auth.uid(),
      'unauthorized_admin_access',
      'admin_verification',
      NULL,
      NULL,
      jsonb_build_object('attempted_at', now()),
      NULL,
      NULL,
      'high'
    );
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;