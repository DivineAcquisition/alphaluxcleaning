-- Phase 1: Add New Roles and Basic Tables

-- Add new roles to existing app_role enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'owner' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')) THEN
        ALTER TYPE public.app_role ADD VALUE 'owner';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'dispatcher' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')) THEN
        ALTER TYPE public.app_role ADD VALUE 'dispatcher';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'cleaner' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')) THEN
        ALTER TYPE public.app_role ADD VALUE 'cleaner';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'support' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')) THEN
        ALTER TYPE public.app_role ADD VALUE 'support';
    END IF;
END $$;

-- Create job status enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
        CREATE TYPE public.job_status AS ENUM (
          'unassigned', 'offered', 'accepted', 'declined', 'in_progress', 
          'completed', 'no_show', 'cancelled', 'paid'
        );
    END IF;
END $$;

-- Create basic customers table to start with
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT,
  last_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  address_json JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  company_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000'
);

-- Create basic cleaners table
CREATE TABLE IF NOT EXISTS public.cleaners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  pay_value NUMERIC DEFAULT 0,
  rating NUMERIC DEFAULT 5.0,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  company_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000'
);

-- Create basic jobs table
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  date_iso DATE NOT NULL,
  time_window TEXT DEFAULT 'morning',
  duration_est_mins INTEGER DEFAULT 120,
  address_json JSONB DEFAULT '{}',
  special_instructions TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  status public.job_status DEFAULT 'unassigned',
  assigned_cleaner_id UUID REFERENCES public.cleaners(id) ON DELETE SET NULL,
  payout_cents INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  company_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000'
);

-- Enable RLS on new tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Add basic RLS policies using company_id (existing column name)
CREATE POLICY "Organization members can view customers" ON public.customers
  FOR SELECT USING (
    company_id IN (
      SELECT ur.company_id FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can view cleaners" ON public.cleaners
  FOR SELECT USING (
    company_id IN (
      SELECT ur.company_id FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can view jobs" ON public.jobs
  FOR SELECT USING (
    company_id IN (
      SELECT ur.company_id FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid()
    )
  );

-- Allow owners and dispatchers to manage data
CREATE POLICY "Owners and dispatchers can manage customers" ON public.customers
  FOR ALL USING (
    company_id IN (
      SELECT ur.company_id FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('owner', 'dispatcher', 'super_admin')
    )
  );

CREATE POLICY "Owners and dispatchers can manage cleaners" ON public.cleaners
  FOR ALL USING (
    company_id IN (
      SELECT ur.company_id FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('owner', 'dispatcher', 'super_admin')
    )
  );

CREATE POLICY "Owners and dispatchers can manage jobs" ON public.jobs
  FOR ALL USING (
    company_id IN (
      SELECT ur.company_id FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('owner', 'dispatcher', 'super_admin')
    )
  );