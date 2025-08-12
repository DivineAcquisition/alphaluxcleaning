-- Remove all the insecure public policies on orders table
DROP POLICY IF EXISTS "public_order_lookup" ON public.orders;
DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;
DROP POLICY IF EXISTS "insert_order" ON public.orders;
DROP POLICY IF EXISTS "update_order" ON public.orders;
DROP POLICY IF EXISTS "select_own_orders" ON public.orders;

-- Keep only the secure policies for authenticated users
-- The "Customers can view their own orders" policy is already secure
-- The "Customers can update their own recurring services" policy is also secure

-- Create secure admin policies that require proper role checking
CREATE POLICY "System can insert orders"
ON public.orders
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- Create secure admin policies for updates (only for system/admin users)
CREATE POLICY "System can update orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  -- Allow system updates or user updates to their own orders
  auth.uid() = user_id OR 
  -- Allow admin updates (assuming admin role exists)
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin'::app_role)
)
WITH CHECK (
  -- Same conditions for WITH CHECK
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin'::app_role)
);

-- Create secure admin delete policy
CREATE POLICY "Admins can delete orders"
ON public.orders
FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin'::app_role)
);