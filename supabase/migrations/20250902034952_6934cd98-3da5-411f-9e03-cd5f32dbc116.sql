-- PHASE 3A: CRITICAL SECURITY HARDENING - CORRECTED
-- Fix critical RLS policy vulnerabilities with correct column names

-- 1. CRITICAL: Fix Public Data Exposure for referral_codes
DROP POLICY IF EXISTS "Active referral codes are publicly readable" ON public.referral_codes;
DROP POLICY IF EXISTS "secure_referral_codes_select" ON public.referral_codes;

CREATE POLICY "secure_referral_codes_select"
ON public.referral_codes
FOR SELECT
TO authenticated
USING (
  owner_email = (auth.jwt() ->> 'email'::text) OR
  (is_active = true AND expires_at > now()) OR
  has_role(auth.uid(), 'super_admin'::app_role)
);

-- 2. Add IP Threat Intelligence Table
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

DROP POLICY IF EXISTS "secure_ip_threat_intelligence" ON public.ip_threat_intelligence;
CREATE POLICY "secure_ip_threat_intelligence"
ON public.ip_threat_intelligence
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3. Security Alerts Table
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

DROP POLICY IF EXISTS "secure_security_alerts_select" ON public.security_alerts;
CREATE POLICY "secure_security_alerts_select"
ON public.security_alerts
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS "secure_security_alerts_manage" ON public.security_alerts;
CREATE POLICY "secure_security_alerts_manage"
ON public.security_alerts
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 4. Security Event Triggers
CREATE OR REPLACE FUNCTION public.trigger_security_monitoring()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Monitor high-risk security events
  IF NEW.risk_level IN ('high', 'critical') THEN
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

-- Add trigger to security_audit_log
DROP TRIGGER IF EXISTS security_monitoring_trigger ON public.security_audit_log;
CREATE TRIGGER security_monitoring_trigger
  AFTER INSERT ON public.security_audit_log
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_security_monitoring();