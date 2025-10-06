-- Allow admins to insert customer records
CREATE POLICY "Admins can insert customer data"
ON public.customers
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'::app_role
  )
);