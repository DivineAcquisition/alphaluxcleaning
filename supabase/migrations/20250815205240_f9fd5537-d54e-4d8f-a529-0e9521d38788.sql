-- Fix commercial estimates security vulnerability - updated approach
-- This addresses the issue where competitors could harvest business contact information

-- First, let's check what policies exist and drop them properly
DROP POLICY IF EXISTS "Anyone can insert commercial estimates" ON public.commercial_estimates;
DROP POLICY IF EXISTS "Users can view their own estimates by email" ON public.commercial_estimates; 
DROP POLICY IF EXISTS "Anyone can view commercial estimates" ON public.commercial_estimates;
DROP POLICY IF EXISTS "Admins can manage all estimates" ON public.commercial_estimates;

-- Add user_id column to track estimate ownership (if not exists)
ALTER TABLE public.commercial_estimates 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Create secure policies that require authentication and proper access control
CREATE POLICY "secure_commercial_estimates_insert" 
ON public.commercial_estimates 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "secure_commercial_estimates_select" 
ON public.commercial_estimates 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR 
    has_role(auth.uid(), 'super_admin'::app_role) OR
    user_id = auth.uid()
  )
);

CREATE POLICY "secure_commercial_estimates_update" 
ON public.commercial_estimates 
FOR UPDATE
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "secure_commercial_estimates_delete" 
ON public.commercial_estimates 
FOR DELETE
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_commercial_estimates_user_id ON public.commercial_estimates(user_id);
CREATE INDEX IF NOT EXISTS idx_commercial_estimates_email ON public.commercial_estimates(email);