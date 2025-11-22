-- Add service role INSERT policy for customers table
CREATE POLICY "Service role can insert customer data"
ON public.customers
FOR INSERT
TO service_role
WITH CHECK (true);