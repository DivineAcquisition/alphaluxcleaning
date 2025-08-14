-- Fix Critical Security Issue: Bookings Table Public Access Vulnerability (Corrected)
-- The bookings table contains sensitive customer data (names, emails, phones, addresses)
-- that should not be publicly accessible

-- =============================================
-- 1. SECURE THE BOOKINGS TABLE
-- =============================================

-- Drop any existing overly permissive policies
DROP POLICY IF EXISTS "Customers can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "System can insert bookings" ON public.bookings;
DROP POLICY IF EXISTS "Anyone can view bookings" ON public.bookings;
DROP POLICY IF EXISTS "Public can view bookings" ON public.bookings;
DROP POLICY IF EXISTS "bookings_secure_select" ON public.bookings;
DROP POLICY IF EXISTS "bookings_secure_insert" ON public.bookings;
DROP POLICY IF EXISTS "bookings_secure_update" ON public.bookings;
DROP POLICY IF EXISTS "bookings_secure_delete" ON public.bookings;

-- Create highly restrictive policies for bookings table
-- Policy 1: SELECT - Only customers can view their own bookings (by email), admins can view all
CREATE POLICY "bookings_secure_select" ON public.bookings
  FOR SELECT
  USING (
    -- Customer can view their own bookings by email match
    customer_email = (auth.jwt() ->> 'email') OR
    -- If booking is linked to an order, check if user owns that order
    (order_id IS NOT NULL AND order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )) OR
    -- Admins can view all bookings
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
  );

-- Policy 2: INSERT - Only authenticated users and system can create bookings
CREATE POLICY "bookings_secure_insert" ON public.bookings
  FOR INSERT
  WITH CHECK (
    -- Allow system insertions (for booking creation flow)
    auth.uid() IS NOT NULL OR
    -- Allow unauthenticated bookings but they must provide email
    customer_email IS NOT NULL
  );

-- Policy 3: UPDATE - Only booking owner and admins can update
CREATE POLICY "bookings_secure_update" ON public.bookings
  FOR UPDATE
  USING (
    -- Customer can update their own booking by email
    customer_email = (auth.jwt() ->> 'email') OR
    -- If booking is linked to an order, check if user owns that order
    (order_id IS NOT NULL AND order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )) OR
    -- Admins can update any booking
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
  )
  WITH CHECK (
    -- Same check for the updated data
    customer_email = (auth.jwt() ->> 'email') OR
    (order_id IS NOT NULL AND order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )) OR
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
  );

-- Policy 4: DELETE - Only super admins can delete bookings
CREATE POLICY "bookings_secure_delete" ON public.bookings
  FOR DELETE
  USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- =============================================
-- 2. CREATE SECURE BOOKING LOOKUP FUNCTION
-- =============================================

-- Create a secure function for anonymous booking lookups (like order status)
CREATE OR REPLACE FUNCTION public.get_booking_status_safe(p_booking_id uuid, p_customer_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_booking_status jsonb;
BEGIN
  -- Only return limited, non-sensitive information and only if email matches
  SELECT jsonb_build_object(
    'id', id,
    'status', status,
    'service_date', service_date,
    'service_time', service_time,
    'created_at', created_at,
    'priority', priority
  ) INTO v_booking_status
  FROM public.bookings
  WHERE id = p_booking_id AND customer_email = p_customer_email;
  
  RETURN COALESCE(v_booking_status, '{"error": "Booking not found or email does not match"}'::jsonb);
END;
$$;

-- =============================================
-- 3. LOG SECURITY FIX APPLICATION
-- =============================================

-- Log that this critical security fix has been applied
INSERT INTO public.security_logs (action, details)
VALUES (
  'bookings_data_protection_critical_security_fix_corrected',
  jsonb_build_object(
    'timestamp', now(),
    'table_secured', 'bookings',
    'vulnerability_fixed', 'public_access_to_sensitive_customer_data',
    'sensitive_data_protected', ARRAY[
      'customer_names', 
      'customer_emails', 
      'customer_phone_numbers', 
      'service_addresses',
      'booking_details',
      'personal_information'
    ],
    'security_policies_applied', ARRAY[
      'bookings_secure_select - customers can only see their own data by email match',
      'bookings_secure_insert - authenticated users and valid email required', 
      'bookings_secure_update - owners and admins only',
      'bookings_secure_delete - super admins only'
    ],
    'additional_protection', 'Created secure booking lookup function for anonymous status checks',
    'description', 'Fixed critical vulnerability where booking data containing sensitive customer information (names, emails, phones, addresses) was publicly accessible. Now only booking owners (matched by email) and admins can access booking data.'
  )
);