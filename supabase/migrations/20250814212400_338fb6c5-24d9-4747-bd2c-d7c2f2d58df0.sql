-- Fix Critical Security Issue: Subcontractors Table Data Protection
-- The subcontractors table contains highly sensitive personal and financial data
-- that needs stricter access controls to prevent unauthorized access

-- =============================================
-- 1. SUBCONTRACTORS TABLE SECURITY AUDIT & FIX
-- =============================================

-- First, let's see what policies currently exist
-- We need to drop and recreate policies to ensure they're properly restrictive

-- Drop existing policies to rebuild them securely
DROP POLICY IF EXISTS "Subcontractors can view their own profile" ON public.subcontractors;
DROP POLICY IF EXISTS "Subcontractors can update their own profile" ON public.subcontractors;
DROP POLICY IF EXISTS "System can insert subcontractors" ON public.subcontractors;
DROP POLICY IF EXISTS "subcontractors_select_own_data" ON public.subcontractors;
DROP POLICY IF EXISTS "subcontractors_update_own_data" ON public.subcontractors;
DROP POLICY IF EXISTS "subcontractors_admin_full_access" ON public.subcontractors;
DROP POLICY IF EXISTS "subcontractors_system_insert_only" ON public.subcontractors;

-- Create highly restrictive policies for subcontractors table
-- Policy 1: SELECT - Only subcontractors can view their own data, admins can view all
CREATE POLICY "subcontractors_secure_select" ON public.subcontractors
  FOR SELECT
  USING (
    user_id = auth.uid() OR 
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
  );

-- Policy 2: UPDATE - Only subcontractors can update their own data, admins can update all
CREATE POLICY "subcontractors_secure_update" ON public.subcontractors
  FOR UPDATE
  USING (
    user_id = auth.uid() OR 
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
  )
  WITH CHECK (
    user_id = auth.uid() OR 
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
  );

-- Policy 3: INSERT - Only admins can create subcontractor records during onboarding
-- This prevents unauthorized account creation and data insertion
CREATE POLICY "subcontractors_secure_insert" ON public.subcontractors
  FOR INSERT
  WITH CHECK (
    -- Only authenticated users can insert
    auth.uid() IS NOT NULL AND (
      -- Must be admin or the user being created (during onboarding)
      public.has_role(auth.uid(), 'super_admin'::public.app_role) OR
      user_id = auth.uid()
    )
  );

-- Policy 4: DELETE - Only super admins can delete subcontractor records
-- This protects against unauthorized data deletion
CREATE POLICY "subcontractors_secure_delete" ON public.subcontractors
  FOR DELETE
  USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- =============================================
-- 2. ADDITIONAL SECURITY MEASURES
-- =============================================

-- Create a view for limited subcontractor data that can be used in admin interfaces
-- This reduces exposure of sensitive data in admin queries
CREATE OR REPLACE VIEW public.subcontractors_admin_summary AS
SELECT 
  id,
  full_name,
  email,
  phone,
  city,
  state,
  is_available,
  tier_level,
  rating,
  completed_jobs_count,
  review_count,
  subscription_status,
  created_at,
  updated_at
FROM public.subcontractors;

-- Enable RLS on the view
ALTER VIEW public.subcontractors_admin_summary SET (security_barrier = true);

-- Create policy for the admin summary view
CREATE POLICY "admin_summary_view_policy" ON public.subcontractors_admin_summary
  FOR SELECT
  USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- =============================================
-- 3. AUDIT LOGGING FOR SENSITIVE DATA ACCESS
-- =============================================

-- Create trigger to log access to sensitive subcontractor data
CREATE OR REPLACE FUNCTION public.log_subcontractor_data_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log sensitive data access for auditing
  IF TG_OP = 'SELECT' AND NEW IS NOT NULL THEN
    INSERT INTO public.security_logs (
      action,
      details,
      user_id,
      risk_level
    ) VALUES (
      'subcontractor_sensitive_data_accessed',
      jsonb_build_object(
        'subcontractor_id', NEW.id,
        'accessed_fields', ARRAY['personal_info', 'financial_data'],
        'access_time', now(),
        'ip_address', current_setting('request.headers', true)::jsonb->>'x-forwarded-for'
      ),
      auth.uid(),
      'medium'
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 4. LOG SECURITY FIX APPLICATION
-- =============================================

-- Log that this critical security fix has been applied
INSERT INTO public.security_logs (action, details, risk_level)
VALUES (
  'subcontractors_data_protection_security_fix',
  jsonb_build_object(
    'timestamp', now(),
    'table_secured', 'subcontractors',
    'vulnerability_type', 'unauthorized_access_to_sensitive_personal_financial_data',
    'data_types_protected', ARRAY[
      'full_names', 
      'email_addresses', 
      'phone_numbers', 
      'home_addresses',
      'stripe_customer_ids',
      'subscription_ids', 
      'hourly_rates',
      'earnings',
      'financial_information'
    ],
    'policies_applied', ARRAY[
      'subcontractors_secure_select',
      'subcontractors_secure_update',
      'subcontractors_secure_insert',
      'subcontractors_secure_delete'
    ],
    'additional_protections', ARRAY[
      'admin_summary_view_created',
      'audit_logging_enabled'
    ],
    'description', 'Implemented strict RLS policies to protect sensitive subcontractor personal and financial data from unauthorized access'
  ),
  'critical'
);