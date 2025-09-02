-- Phase 1: Foundation Layer - Multi-Domain Architecture Setup (Fixed)
-- Create default Bay Area Cleaning Pros company and implement multi-tenancy

-- First, add subcontractor role to the enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'subcontractor' AND enumtypid = 'app_role'::regtype) THEN
        ALTER TYPE app_role ADD VALUE 'subcontractor';
    END IF;
END$$;

-- Insert the default company for Bay Area Cleaning Pros
INSERT INTO public.companies (
  id,
  name,
  email,
  phone,
  address,
  city,
  state,
  zip_code,
  website,
  industry,
  description
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000', -- Fixed UUID for Bay Area Cleaning Pros
  'Bay Area Cleaning Pros',
  'admin@bayareacleaningpros.com',
  '+1-555-0100',
  '123 Business Ave',
  'San Francisco',
  'CA',
  '94105',
  'https://bayareacleaningpros.com',
  'Professional Cleaning Services',
  'Leading cleaning service provider in the Bay Area'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = now();

-- Add company_id to key tables that need multi-tenancy
-- These changes are additive and won't break existing functionality

-- Add company_id to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS company_id uuid 
DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid
REFERENCES public.companies(id);

-- Add company_id to bookings table  
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS company_id uuid
DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid
REFERENCES public.companies(id);

-- Add company_id to customer_profiles table
ALTER TABLE public.customer_profiles
ADD COLUMN IF NOT EXISTS company_id uuid
DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid
REFERENCES public.companies(id);

-- Add company_id to subcontractors table
ALTER TABLE public.subcontractors
ADD COLUMN IF NOT EXISTS company_id uuid
DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid
REFERENCES public.companies(id);

-- Add company_id to commercial_estimates table
ALTER TABLE public.commercial_estimates
ADD COLUMN IF NOT EXISTS company_id uuid
DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid
REFERENCES public.companies(id);

-- Create role-based domain routing configuration table
CREATE TABLE IF NOT EXISTS public.domain_routing_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subdomain text NOT NULL UNIQUE,
  allowed_roles app_role[] NOT NULL DEFAULT '{user}',
  default_redirect_path text NOT NULL DEFAULT '/',
  company_id uuid NOT NULL REFERENCES public.companies(id),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Insert domain routing configuration for Bay Area Cleaning Pros
INSERT INTO public.domain_routing_config (subdomain, allowed_roles, default_redirect_path, company_id) VALUES
('app', '{admin}', '/admin', '550e8400-e29b-41d4-a716-446655440000'),
('contractor', '{subcontractor}', '/subcontractor-portal', '550e8400-e29b-41d4-a716-446655440000'), 
('booking', '{user}', '/booking', '550e8400-e29b-41d4-a716-446655440000'),
('www', '{user}', '/', '550e8400-e29b-41d4-a716-446655440000')
ON CONFLICT (subdomain) DO UPDATE SET
  allowed_roles = EXCLUDED.allowed_roles,
  default_redirect_path = EXCLUDED.default_redirect_path,
  updated_at = now();

-- Enable RLS on domain routing config
ALTER TABLE public.domain_routing_config ENABLE ROW LEVEL SECURITY;

-- Create policy for domain routing config
CREATE POLICY "Public can view active domain routing"
ON public.domain_routing_config
FOR SELECT
USING (is_active = true);

-- Create updated_at trigger for domain_routing_config
CREATE TRIGGER update_domain_routing_config_updated_at
BEFORE UPDATE ON public.domain_routing_config
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Create function to get user's allowed domains
CREATE OR REPLACE FUNCTION public.get_user_allowed_domains(p_user_id uuid)
RETURNS TABLE(subdomain text, default_redirect_path text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_roles app_role[];
BEGIN
  -- Get all roles for the user
  SELECT array_agg(role) INTO v_user_roles
  FROM public.user_roles
  WHERE user_id = p_user_id;
  
  -- If no roles found, default to user (customer)
  IF v_user_roles IS NULL THEN
    v_user_roles := '{user}';
  END IF;
  
  -- Return domains where user has at least one matching role
  RETURN QUERY
  SELECT drc.subdomain, drc.default_redirect_path
  FROM public.domain_routing_config drc
  WHERE drc.is_active = true
    AND drc.allowed_roles && v_user_roles;
END;
$$;