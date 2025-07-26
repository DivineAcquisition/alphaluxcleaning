-- Update the profiles table to include more user information
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role_display_name TEXT;

-- Update the handle_new_user function to assign default customer role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name)
    VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
    
    -- Assign default customer role unless specified otherwise
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'customer')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RETURN NEW;
END;
$$;

-- Create additional RLS policies for better access control
CREATE POLICY "Users can view own profile and admins can view all" 
ON public.profiles 
FOR SELECT 
USING (id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update any profile, users can update their own
CREATE POLICY "Users can update own profile, admins can update all" 
ON public.profiles 
FOR UPDATE 
USING (id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Create auth redirect configuration
CREATE TABLE IF NOT EXISTS public.auth_redirects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  redirect_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default redirect paths for each role
INSERT INTO public.auth_redirects (role, redirect_path) VALUES 
('admin', '/admin-dashboard'),
('employee', '/admin-dashboard'),
('customer', '/customer-service-portal')
ON CONFLICT DO NOTHING;

-- Allow admins to manage auth redirects
ALTER TABLE public.auth_redirects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage auth redirects" 
ON public.auth_redirects 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));