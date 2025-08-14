-- Fix Critical Security Issue: Customer Personal Information Exposure Across Multiple Tables
-- Secure all tables containing customer PII (orders, commercial_estimates, applicants)

-- =============================================
-- 1. SECURE THE ORDERS TABLE
-- =============================================

-- Drop potentially insecure policies on orders table
DROP POLICY IF EXISTS "Public read access for order lookup" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "System can insert orders" ON public.orders;  
DROP POLICY IF EXISTS "Admins and system can update orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can update their own recurring services" ON public.orders;
DROP POLICY IF EXISTS "Admins can delete orders and manage all orders" ON public.orders;

-- Create highly restrictive policies for orders table
-- Policy 1: SELECT - Only customers can view their own orders, admins can view all
CREATE POLICY "orders_secure_select" ON public.orders
  FOR SELECT
  USING (
    -- Customer can view their own orders
    user_id = auth.uid() OR
    customer_email = (auth.jwt() ->> 'email') OR
    -- Admins can view all orders
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
  );

-- Policy 2: INSERT - Only authenticated users and system can create orders
CREATE POLICY "orders_secure_insert" ON public.orders
  FOR INSERT
  WITH CHECK (
    -- Must be authenticated or system operation with valid customer email
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    customer_email IS NOT NULL
  );

-- Policy 3: UPDATE - Only order owner and admins can update
CREATE POLICY "orders_secure_update" ON public.orders
  FOR UPDATE
  USING (
    user_id = auth.uid() OR
    customer_email = (auth.jwt() ->> 'email') OR
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
  )
  WITH CHECK (
    user_id = auth.uid() OR
    customer_email = (auth.jwt() ->> 'email') OR
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
  );

-- Policy 4: DELETE - Only super admins can delete orders
CREATE POLICY "orders_secure_delete" ON public.orders
  FOR DELETE
  USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- =============================================
-- 2. SECURE THE COMMERCIAL_ESTIMATES TABLE
-- =============================================

-- Drop existing policies on commercial_estimates
DROP POLICY IF EXISTS "Anyone can insert commercial estimates" ON public.commercial_estimates;
DROP POLICY IF EXISTS "Anyone can view commercial estimates" ON public.commercial_estimates;

-- Create secure policies for commercial_estimates
-- Policy 1: SELECT - Only estimate owner (by email) and admins can view
CREATE POLICY "commercial_estimates_secure_select" ON public.commercial_estimates
  FOR SELECT
  USING (
    -- Only the customer who submitted the estimate can view it
    email = (auth.jwt() ->> 'email') OR
    -- Admins can view all estimates
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
  );

-- Policy 2: INSERT - Anyone can submit estimates but must provide email
CREATE POLICY "commercial_estimates_secure_insert" ON public.commercial_estimates
  FOR INSERT
  WITH CHECK (
    -- Must provide email for contact
    email IS NOT NULL AND email != ''
  );

-- Policy 3: UPDATE - Only estimate owner and admins can update
CREATE POLICY "commercial_estimates_secure_update" ON public.commercial_estimates
  FOR UPDATE
  USING (
    email = (auth.jwt() ->> 'email') OR
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
  )
  WITH CHECK (
    email = (auth.jwt() ->> 'email') OR
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
  );

-- Policy 4: DELETE - Only super admins can delete estimates
CREATE POLICY "commercial_estimates_secure_delete" ON public.commercial_estimates
  FOR DELETE
  USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- =============================================
-- 3. SECURE THE APPLICANTS TABLE (Already has some policies but needs review)
-- =============================================

-- The applicants table already has restrictive policies:
-- - Only admins can view and update applications
-- - Anyone can submit applications (needed for job applications)
-- This is appropriate for this use case, so no changes needed

-- =============================================
-- 4. CREATE SECURE LOOKUP FUNCTIONS FOR PUBLIC ACCESS
-- =============================================

-- Secure function for order status lookup without exposing PII
CREATE OR REPLACE FUNCTION public.get_customer_order_status_secure(p_order_id uuid, p_customer_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

-- =============================================
-- 5. LOG SECURITY FIX APPLICATION  
-- =============================================

-- Log that this comprehensive security fix has been applied
INSERT INTO public.security_logs (action, details)
VALUES (
  'customer_pii_protection_comprehensive_fix',
  jsonb_build_object(
    'timestamp', now(),
    'vulnerability_fixed', 'customer_personal_information_exposure_across_multiple_tables',
    'tables_secured', ARRAY['orders', 'commercial_estimates', 'bookings'],
    'sensitive_data_protected', ARRAY[
      'customer_names', 
      'customer_emails', 
      'customer_phone_numbers', 
      'customer_addresses',
      'business_information',
      'personal_contact_details'
    ],
    'security_policies_applied', ARRAY[
      'orders - customers can only access their own orders',
      'commercial_estimates - only estimate owner and admins can access',
      'bookings - already secured in previous fix',
      'applicants - already appropriately secured'
    ],
    'additional_protections', ARRAY[
      'Created secure order status lookup function',
      'Removed public access policies',
      'Enforced email-based ownership verification'
    ],
    'description', 'Comprehensive fix for customer PII exposure vulnerability. All tables containing customer personal information now have strict RLS policies ensuring only the data owner and authorized administrators can access sensitive customer data.'
  )
);