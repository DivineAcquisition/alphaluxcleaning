-- PHASE 2: APPLICATION SECURITY & AUDIT SYSTEM
-- Create comprehensive audit logging and security monitoring

-- Security audit log table for tracking all admin actions
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  action_type text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  session_id text,
  risk_level text NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical'))
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only super admins can view audit logs
CREATE POLICY "Super admins can view audit logs"
ON public.security_audit_log
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
ON public.security_audit_log
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Failed login attempts tracking
CREATE TABLE IF NOT EXISTS public.failed_login_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  ip_address inet NOT NULL,
  user_agent text,
  attempt_time timestamp with time zone NOT NULL DEFAULT now(),
  failure_reason text
);

-- Enable RLS on failed login attempts
ALTER TABLE public.failed_login_attempts ENABLE ROW LEVEL SECURITY;

-- Only super admins can view failed login attempts
CREATE POLICY "Super admins can view failed login attempts"
ON public.failed_login_attempts
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- System can insert failed login attempts
CREATE POLICY "System can insert failed login attempts"
ON public.failed_login_attempts
FOR INSERT
WITH CHECK (true);

-- Session management table for tracking active sessions
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token text NOT NULL UNIQUE,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  last_activity timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  terminated_reason text
);

-- Enable RLS on user sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own sessions
CREATE POLICY "Users can view their own sessions"
ON public.user_sessions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Super admins can view all sessions
CREATE POLICY "Super admins can view all sessions"
ON public.user_sessions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- System can manage sessions
CREATE POLICY "System can manage user sessions"
ON public.user_sessions
FOR ALL
WITH CHECK (true);

-- Function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id uuid,
  p_action_type text,
  p_resource_type text,
  p_resource_id text DEFAULT NULL,
  p_old_values jsonb DEFAULT NULL,
  p_new_values jsonb DEFAULT NULL,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_risk_level text DEFAULT 'low'
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

-- Function to check for suspicious activity
CREATE OR REPLACE FUNCTION public.check_suspicious_activity(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- Trigger function to automatically log role changes
CREATE OR REPLACE FUNCTION public.trigger_log_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log role assignment
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_security_event(
      NEW.user_id,
      'role_assigned',
      'user_roles',
      NEW.id::text,
      NULL,
      to_jsonb(NEW),
      NULL,
      NULL,
      CASE WHEN NEW.role = 'super_admin' THEN 'critical' ELSE 'medium' END
    );
    RETURN NEW;
  END IF;
  
  -- Log role removal
  IF TG_OP = 'DELETE' THEN
    PERFORM public.log_security_event(
      OLD.user_id,
      'role_removed',
      'user_roles',
      OLD.id::text,
      to_jsonb(OLD),
      NULL,
      NULL,
      NULL,
      CASE WHEN OLD.role = 'super_admin' THEN 'critical' ELSE 'medium' END
    );
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Create trigger for role changes
DROP TRIGGER IF EXISTS trigger_audit_role_changes ON public.user_roles;
CREATE TRIGGER trigger_audit_role_changes
  AFTER INSERT OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_log_role_change();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON public.security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_timestamp ON public.security_audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_risk_level ON public.security_audit_log(risk_level);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_email ON public.failed_login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_time ON public.failed_login_attempts(attempt_time);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON public.user_sessions(is_active) WHERE is_active = true;