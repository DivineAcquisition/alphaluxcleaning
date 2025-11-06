-- Allow authenticated users to insert customer records during checkout
CREATE POLICY "Authenticated users can insert customer records"
ON public.customers
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow customers to update their own records
CREATE POLICY "Customers can update their own records"
ON public.customers
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());