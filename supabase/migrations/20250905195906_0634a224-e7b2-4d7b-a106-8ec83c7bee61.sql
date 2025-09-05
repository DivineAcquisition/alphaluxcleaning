-- Phase 1: Core Data Model & Role System Updates (Safe Version)

-- Add new roles to existing enum (only if they don't exist)
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

-- Create new enums only if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
        CREATE TYPE public.job_status AS ENUM (
          'unassigned', 'offered', 'accepted', 'declined', 'in_progress', 
          'completed', 'no_show', 'cancelled', 'paid'
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_recurrence') THEN
        CREATE TYPE public.job_recurrence AS ENUM ('one_time', 'biweekly', 'monthly');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'time_window') THEN
        CREATE TYPE public.time_window AS ENUM ('morning', 'afternoon', 'evening');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pay_type') THEN
        CREATE TYPE public.pay_type AS ENUM ('flat', 'hourly', 'percent');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cleaner_status') THEN
        CREATE TYPE public.cleaner_status AS ENUM ('active', 'inactive', 'suspended');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_event_type') THEN
        CREATE TYPE public.job_event_type AS ENUM (
          'created', 'offered', 'accepted', 'declined', 'started', 'paused', 
          'resumed', 'completed', 'no_show', 'cancelled', 'reassigned', 'paid'
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'actor_role') THEN
        CREATE TYPE public.actor_role AS ENUM ('owner', 'dispatcher', 'cleaner', 'customer', 'system');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_status') THEN
        CREATE TYPE public.invoice_status AS ENUM ('pending', 'paid', 'refunded', 'failed');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payout_status') THEN
        CREATE TYPE public.payout_status AS ENUM ('pending', 'approved', 'paid');
    END IF;
END $$;

-- Create customers table (only if it doesn't exist)
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
  organization_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000'
);

-- Create cleaners table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.cleaners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT NOT NULL,
  status public.cleaner_status DEFAULT 'active',
  pay_type public.pay_type DEFAULT 'flat',
  pay_value NUMERIC DEFAULT 0,
  rating NUMERIC DEFAULT 5.0,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  organization_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000'
);

-- Create jobs table (only if it doesn't exist)  
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  recurrence public.job_recurrence DEFAULT 'one_time',
  date_iso DATE NOT NULL,
  time_window public.time_window DEFAULT 'morning',
  duration_est_mins INTEGER DEFAULT 120,
  address_json JSONB DEFAULT '{}',
  special_instructions TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  status public.job_status DEFAULT 'unassigned',
  assigned_cleaner_id UUID REFERENCES public.cleaners(id) ON DELETE SET NULL,
  payout_cents INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  organization_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000'
);

-- Enable RLS on new tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Add basic RLS policies
CREATE POLICY "Organization members can view customers" ON public.customers
  FOR SELECT USING (
    organization_id IN (
      SELECT ur.company_id FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can view cleaners" ON public.cleaners
  FOR SELECT USING (
    organization_id IN (
      SELECT ur.company_id FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can view jobs" ON public.jobs
  FOR SELECT USING (
    organization_id IN (
      SELECT ur.company_id FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid()
    )
  );