-- Fix critical security issue: Restrict public access to customers table
-- Drop the overly permissive policy that allows anyone to read all customer data
DROP POLICY IF EXISTS "Allow read own customer data" ON public.customers;

-- Create proper policies for customer data access
-- 1. Admins can view all customer data
CREATE POLICY "Admins can view all customer data"
ON public.customers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'::app_role
  )
);

-- 2. Customers can view only their own data (if they have a user_id)
CREATE POLICY "Customers can view their own data"
ON public.customers
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 3. Allow service role (edge functions) to read customer data
CREATE POLICY "Service role can read all customer data"
ON public.customers
FOR SELECT
TO service_role
USING (true);

-- Allow service role to update customer data (for edge functions)
CREATE POLICY "Service role can update customer data"
ON public.customers
FOR UPDATE
TO service_role
USING (true);

-- Note: Anonymous insert policy "Allow anonymous insert on customers" remains unchanged
-- This is needed for the booking flow where customers create accounts