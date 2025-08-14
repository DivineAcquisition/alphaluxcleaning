-- Fix Critical Security Issue: Subcontractors Table Data Protection (Final)
-- The subcontractors table contains highly sensitive personal and financial data
-- that needs stricter access controls to prevent unauthorized access

-- =============================================
-- 1. SUBCONTRACTORS TABLE SECURITY FIX
-- =============================================

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

-- Policy 3: INSERT - Only admins and the user being created can insert records
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
-- 2. CREATE SECURE FUNCTION FOR LIMITED ADMIN ACCESS
-- =============================================

-- Create a secure function that returns limited subcontractor data for admin interfaces
-- This minimizes exposure of sensitive financial data
CREATE OR REPLACE FUNCTION public.get_subcontractors_admin_summary()
RETURNS TABLE (
  id uuid,
  full_name text,
  email text,
  phone text,
  city text,
  state text,
  is_available boolean,
  tier_level integer,
  rating numeric,
  completed_jobs_count integer,
  review_count integer,
  subscription_status text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow admins to call this function
  IF NOT public.has_role(auth.uid(), 'super_admin'::public.app_role) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Return limited data set (excludes sensitive financial info like Stripe IDs, addresses, earnings)
  RETURN QUERY
  SELECT 
    s.id,
    s.full_name,
    s.email,
    s.phone,
    s.city,
    s.state,
    s.is_available,
    s.tier_level,
    s.rating,
    s.completed_jobs_count,
    s.review_count,
    s.subscription_status,
    s.created_at,
    s.updated_at
  FROM public.subcontractors s;
END;
$$;

-- =============================================
-- 3. LOG SECURITY FIX APPLICATION
-- =============================================

-- Log that this critical security fix has been applied
INSERT INTO public.security_logs (action, details)
VALUES (
  'subcontractors_data_protection_critical_security_fix',
  jsonb_build_object(
    'timestamp', now(),
    'table_secured', 'subcontractors',
    'vulnerability_fixed', 'unauthorized_access_to_sensitive_personal_financial_data',
    'sensitive_data_protected', ARRAY[
      'full_names', 
      'email_addresses', 
      'phone_numbers', 
      'home_addresses',
      'stripe_customer_ids',
      'subscription_ids', 
      'hourly_rates',
      'total_earnings'
    ],
    'security_policies_applied', ARRAY[
      'subcontractors_secure_select',
      'subcontractors_secure_update', 
      'subcontractors_secure_insert',
      'subcontractors_secure_delete'
    ],
    'access_control', 'Only subcontractors can access their own data, admins have controlled access',
    'additional_protection', 'Created secure admin summary function to limit data exposure'
  )
);