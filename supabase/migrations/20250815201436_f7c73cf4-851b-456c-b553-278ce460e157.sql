-- Fix commercial estimates security vulnerability
-- This addresses the issue where competitors could harvest business contact information

-- Drop existing insecure policies
DROP POLICY IF EXISTS "Anyone can insert commercial estimates" ON public.commercial_estimates;
DROP POLICY IF EXISTS "Anyone can view commercial estimates" ON public.commercial_estimates;

-- Create secure policies that require authentication and proper access control
CREATE POLICY "Authenticated users can submit estimates" 
ON public.commercial_estimates 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view their own estimates by email" 
ON public.commercial_estimates 
FOR SELECT 
USING (
  email = auth.email() OR 
  has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Admins can manage all estimates" 
ON public.commercial_estimates 
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Add user_id column to track estimate ownership
ALTER TABLE public.commercial_estimates 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_commercial_estimates_user_id ON public.commercial_estimates(user_id);
CREATE INDEX IF NOT EXISTS idx_commercial_estimates_email ON public.commercial_estimates(email);