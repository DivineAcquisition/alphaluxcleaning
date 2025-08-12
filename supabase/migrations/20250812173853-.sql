-- Fix critical security vulnerability in commercial_estimates table

-- Remove the dangerous public read policy
DROP POLICY IF EXISTS "Anyone can view commercial estimates" ON public.commercial_estimates;

-- Create secure RLS policies for commercial_estimates table
-- Only admins and authorized sales staff can view commercial estimates
CREATE POLICY "Admins can view all commercial estimates"
ON public.commercial_estimates
FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin'::app_role)
);

-- Allow authorized users (like sales staff) to manage commercial estimates
CREATE POLICY "Authorized users can update commercial estimates"
ON public.commercial_estimates
FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin'::app_role)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin'::app_role)
);

-- Allow authorized users to delete commercial estimates
CREATE POLICY "Authorized users can delete commercial estimates"
ON public.commercial_estimates
FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin'::app_role)
);

-- Create a secure function for estimate submission confirmation (public facing)
-- This allows the business to check their estimate status without exposing all data
CREATE OR REPLACE FUNCTION public.get_estimate_status_safe(p_estimate_id uuid, p_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_estimate jsonb;
BEGIN
  -- Only return limited, non-sensitive information and only if email matches
  SELECT jsonb_build_object(
    'id', id,
    'business_name', business_name,
    'status', status,
    'created_at', created_at,
    'service_type', service_type,
    'cleaning_type', cleaning_type
  ) INTO v_estimate
  FROM public.commercial_estimates
  WHERE id = p_estimate_id AND email = p_email;
  
  RETURN COALESCE(v_estimate, '{"error": "Estimate not found or email does not match"}'::jsonb);
END;
$$;

-- Grant execute permissions for the safe lookup function
GRANT EXECUTE ON FUNCTION public.get_estimate_status_safe(uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_estimate_status_safe(uuid, text) TO authenticated;