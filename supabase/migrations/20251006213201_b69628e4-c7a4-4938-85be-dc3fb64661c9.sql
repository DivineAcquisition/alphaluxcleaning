-- Drop the existing policy
DROP POLICY IF EXISTS "Admins can insert customer data" ON public.customers;

-- Create updated policy that checks both profiles and admin_users
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
  OR EXISTS (
    SELECT 1
    FROM admin_users
    WHERE admin_users.user_id = auth.uid()
      AND admin_users.status = 'active'
      AND admin_users.role IN ('admin', 'ops')
  )
);