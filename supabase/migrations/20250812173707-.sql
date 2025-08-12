-- Fix critical security vulnerabilities in applicant data tables

-- First, remove the dangerous public read policy on applicants table
DROP POLICY IF EXISTS "Anyone can view applications by token" ON public.applicants;
DROP POLICY IF EXISTS "System can update applications" ON public.applicants;

-- Create secure RLS policies for applicants table
-- Only admins can view applicant data
CREATE POLICY "Admins can view all applications"
ON public.applicants
FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin'::app_role)
);

-- Only admins can update applicant data
CREATE POLICY "Admins can update applications"
ON public.applicants
FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin'::app_role)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin'::app_role)
);

-- Allow applicants to view their own application by token (secure lookup)
CREATE OR REPLACE FUNCTION public.get_application_by_token(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- Grant execute permissions for the safe lookup function
GRANT EXECUTE ON FUNCTION public.get_application_by_token(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_application_by_token(text) TO authenticated;

-- Now secure the subcontractor_applications table (it only allows INSERT currently which is good)
-- But add admin access policies

CREATE POLICY "Admins can view subcontractor applications"
ON public.subcontractor_applications
FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin'::app_role)
);

CREATE POLICY "Admins can update subcontractor applications"
ON public.subcontractor_applications
FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin'::app_role)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin'::app_role)
);

CREATE POLICY "Admins can delete subcontractor applications"
ON public.subcontractor_applications
FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin'::app_role)
);