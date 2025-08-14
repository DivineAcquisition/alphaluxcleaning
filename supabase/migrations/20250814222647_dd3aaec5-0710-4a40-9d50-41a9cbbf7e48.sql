-- Phase 1: Secure Business Data - Fix tier_system_config and busy_slots access

-- Drop the overly permissive policy on tier_system_config
DROP POLICY IF EXISTS "Anyone can view tier system config" ON public.tier_system_config;

-- Create proper restricted policies for tier_system_config
CREATE POLICY "Authenticated users can view active tier config" 
ON public.tier_system_config 
FOR SELECT 
TO authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage tier system config" 
ON public.tier_system_config 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Fix busy_slots table - currently has no proper RLS policies
-- Drop any existing overly permissive policies
DROP POLICY IF EXISTS "System can manage busy slots" ON public.busy_slots;

-- Create proper RLS policies for busy_slots
CREATE POLICY "Subcontractors can view their own busy slots" 
ON public.busy_slots 
FOR SELECT 
TO authenticated
USING (
  subcontractor_id IN (
    SELECT id FROM public.subcontractors 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Subcontractors can manage their own busy slots" 
ON public.busy_slots 
FOR ALL 
TO authenticated
USING (
  subcontractor_id IN (
    SELECT id FROM public.subcontractors 
    WHERE user_id = auth.uid()
  ) OR has_role(auth.uid(), 'super_admin'::app_role)
)
WITH CHECK (
  subcontractor_id IN (
    SELECT id FROM public.subcontractors 
    WHERE user_id = auth.uid()
  ) OR has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "System can insert busy slots for sync"
ON public.busy_slots
FOR INSERT
USING (true);

-- Fix remaining SECURITY DEFINER functions with mutable search paths
CREATE OR REPLACE FUNCTION public.get_order_status_safe(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_order_status jsonb;
BEGIN
  -- Only return limited, non-sensitive order information
  SELECT jsonb_build_object(
    'id', id,
    'status', status,
    'created_at', created_at,
    'scheduled_date', scheduled_date,
    'amount', amount,
    'service_type', service_details->>'service_type'
  ) INTO v_order_status
  FROM public.orders
  WHERE id = p_order_id;
  
  RETURN COALESCE(v_order_status, '{"error": "Order not found"}'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_application_by_token(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_application jsonb;
BEGIN
  -- Only return limited, necessary information for the applicant
  SELECT jsonb_build_object(
    'id', id,
    'full_name', full_name,
    'status', status,
    'created_at', created_at,
    'interview_date', interview_date,
    'orientation_date', orientation_date,
    'orientation_time', orientation_time
  ) INTO v_application
  FROM public.applicants
  WHERE onboarding_token = p_token;
  
  RETURN COALESCE(v_application, '{"error": "Application not found"}'::jsonb);
END;
$$;

-- Log security improvements
INSERT INTO public.security_logs (action, details)
VALUES (
  'security_policies_updated',
  jsonb_build_object(
    'timestamp', now(),
    'changes', jsonb_build_array(
      'Restricted tier_system_config access to authenticated users only',
      'Implemented proper RLS policies for busy_slots table',
      'Fixed SECURITY DEFINER functions with immutable search paths'
    ),
    'security_level', 'critical_fix'
  )
);