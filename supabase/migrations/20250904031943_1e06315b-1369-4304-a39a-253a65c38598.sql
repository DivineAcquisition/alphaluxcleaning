-- Phase 1: Update role system and implement single-tenant architecture

-- First, let's update the app_role enum to match requirements
ALTER TYPE app_role RENAME TO app_role_old;

CREATE TYPE app_role AS ENUM ('admin', 'manager', 'contractor', 'customer');

-- Create a mapping function for role migration
CREATE OR REPLACE FUNCTION migrate_role(old_role text) 
RETURNS app_role 
LANGUAGE sql 
IMMUTABLE 
AS $$
  SELECT CASE 
    WHEN old_role IN ('super_admin', 'owner') THEN 'admin'::app_role
    WHEN old_role IN ('office_manager') THEN 'manager'::app_role
    WHEN old_role IN ('subcontractor', 'field_cleaner', 'recurring_cleaner', 'subcontractor_partner') THEN 'contractor'::app_role
    WHEN old_role IN ('customer', 'enterprise_client', 'client') THEN 'customer'::app_role
    ELSE 'customer'::app_role
  END
$$;

-- Create new user_roles table with updated enum
CREATE TABLE user_roles_new (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  company_id uuid NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, role, company_id)
);

-- Migrate existing role data
INSERT INTO user_roles_new (user_id, role, company_id, created_at, updated_at)
SELECT 
  user_id, 
  migrate_role(role::text),
  '550e8400-e29b-41d4-a716-446655440000',
  created_at,
  updated_at
FROM user_roles
ON CONFLICT (user_id, role, company_id) DO NOTHING;

-- Drop old table and rename new one
DROP TABLE user_roles CASCADE;
ALTER TABLE user_roles_new RENAME TO user_roles;

-- Enable RLS on user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policies for user_roles
CREATE POLICY "Users can view their own roles" 
ON user_roles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles" 
ON user_roles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
  )
);

-- Update the has_role function to work with new structure
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role, _company_id uuid DEFAULT '550e8400-e29b-41d4-a716-446655440000')
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND company_id = _company_id
  )
$$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid, _company_id uuid DEFAULT '550e8400-e29b-41d4-a716-446655440000')
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id 
    AND company_id = _company_id
  ORDER BY 
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'manager' THEN 2  
      WHEN 'contractor' THEN 3
      WHEN 'customer' THEN 4
    END
  LIMIT 1
$$;

-- Add company_id to relevant tables that don't have it
-- Update domain_routing_config if it needs company_id awareness
ALTER TABLE domain_routing_config 
ADD COLUMN IF NOT EXISTS company_id uuid NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000';

-- Drop the old enum
DROP TYPE app_role_old CASCADE;

-- Create trigger to update updated_at
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();