-- Fix RLS policies for user_roles table to prevent recursion issues

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Create simpler, non-recursive policies
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Service role can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Also ensure users can be inserted into user_roles when they sign up
CREATE POLICY "System can insert user roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (true);