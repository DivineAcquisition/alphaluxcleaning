-- Allow anonymous/public users to update customer records during booking flow
-- This enables the upsert operation on the checkout page when a returning customer books again
-- The upsert uses onConflict: 'email' so only updates when email matches exactly

CREATE POLICY "Allow anonymous update during booking" 
ON public.customers 
FOR UPDATE 
TO public
USING (true)
WITH CHECK (true);