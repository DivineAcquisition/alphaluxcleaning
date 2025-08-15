-- Phase 1: Critical Security Fixes - Updated (avoiding conflicts)

-- 1. Secure companies table - add read-only policy for basic info
CREATE POLICY "Users can view basic company info" 
ON public.companies 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 2. Add admin access to all payments (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'subcontractor_payments' 
        AND policyname = 'Admins can manage all payments'
    ) THEN
        CREATE POLICY "Admins can manage all payments" 
        ON public.subcontractor_payments 
        FOR ALL 
        USING (has_role(auth.uid(), 'super_admin'::app_role))
        WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
    END IF;
END $$;

-- 3. Create secure function to check if user can access sensitive data
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

-- 4. Add security audit logging function
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

-- 5. Secure failed login attempts table (only if not already secured)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'failed_login_attempts' 
        AND policyname = 'Admins can view failed login attempts'
    ) THEN
        CREATE POLICY "Admins can view failed login attempts" 
        ON public.failed_login_attempts 
        FOR SELECT 
        USING (has_role(auth.uid(), 'super_admin'::app_role));
    END IF;
END $$;

-- 6. Secure security audit log (only if not already secured)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'security_audit_log' 
        AND policyname = 'Admins can view security logs'
    ) THEN
        CREATE POLICY "Admins can view security logs" 
        ON public.security_audit_log 
        FOR SELECT 
        USING (has_role(auth.uid(), 'super_admin'::app_role));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'security_audit_log' 
        AND policyname = 'Users can view their own security logs'
    ) THEN
        CREATE POLICY "Users can view their own security logs" 
        ON public.security_audit_log 
        FOR SELECT 
        USING (user_id = auth.uid());
    END IF;
END $$;

-- 7. Add function to mask sensitive data
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

-- 8. Create secure admin verification function
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