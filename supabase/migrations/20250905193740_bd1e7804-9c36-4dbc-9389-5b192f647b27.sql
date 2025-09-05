-- Phase 1: Core Data Model & Role System Updates

-- Add new roles to existing enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'owner';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'dispatcher';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cleaner';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'support';

-- Create status enums for jobs and other entities
CREATE TYPE public.job_status AS ENUM (
  'unassigned', 'offered', 'accepted', 'declined', 'in_progress', 
  'completed', 'no_show', 'cancelled', 'paid'
);

CREATE TYPE public.job_recurrence AS ENUM ('one_time', 'biweekly', 'monthly');
CREATE TYPE public.time_window AS ENUM ('morning', 'afternoon', 'evening');
CREATE TYPE public.pay_type AS ENUM ('flat', 'hourly', 'percent');
CREATE TYPE public.cleaner_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE public.job_event_type AS ENUM (
  'created', 'offered', 'accepted', 'declined', 'started', 'paused', 
  'resumed', 'completed', 'no_show', 'cancelled', 'reassigned', 'paid'
);
CREATE TYPE public.actor_role AS ENUM ('owner', 'dispatcher', 'cleaner', 'customer', 'system');
CREATE TYPE public.invoice_status AS ENUM ('pending', 'paid', 'refunded', 'failed');
CREATE TYPE public.payout_status AS ENUM ('pending', 'approved', 'paid');

-- Create customers table (consolidating from customer_profiles)
CREATE TABLE public.customers (
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

-- Create cleaners table (restructured from subcontractors)
CREATE TABLE public.cleaners (
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

-- Create jobs table (restructured from orders)
CREATE TABLE public.jobs (
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

-- Create job_events table for audit trail
CREATE TABLE public.job_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  event public.job_event_type NOT NULL,
  actor_id UUID,
  actor_role public.actor_role NOT NULL,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  organization_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000'
);

-- Create schedules table for cleaner availability
CREATE TABLE public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaner_id UUID REFERENCES public.cleaners(id) ON DELETE CASCADE NOT NULL,
  weekday INTEGER NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_to DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  organization_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000'
);

-- Create nps_surveys table
CREATE TABLE public.nps_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  organization_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000'
);

-- Create settings_ops table
CREATE TABLE public.settings_ops (
  organization_id UUID PRIMARY KEY DEFAULT '550e8400-e29b-41d4-a716-446655440000',
  cancel_policy_text TEXT,
  sms_from_number TEXT,
  email_from TEXT,
  dispatch_rules JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Update invoices table structure
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  stripe_payment_intent_id TEXT,
  amount_cents INTEGER NOT NULL DEFAULT 0,
  status public.invoice_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  organization_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000'
);

-- Create payouts table
CREATE TABLE public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaner_id UUID REFERENCES public.cleaners(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  payout_cents INTEGER NOT NULL DEFAULT 0,
  status public.payout_status DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  organization_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000'
);

-- Add indexes for performance
CREATE INDEX idx_customers_organization ON public.customers(organization_id);
CREATE INDEX idx_customers_email ON public.customers(email);
CREATE INDEX idx_cleaners_organization ON public.cleaners(organization_id);
CREATE INDEX idx_cleaners_status ON public.cleaners(status);
CREATE INDEX idx_jobs_organization ON public.jobs(organization_id);
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_jobs_date ON public.jobs(date_iso);
CREATE INDEX idx_jobs_assigned_cleaner ON public.jobs(assigned_cleaner_id);
CREATE INDEX idx_job_events_job_id ON public.job_events(job_id);
CREATE INDEX idx_schedules_cleaner ON public.schedules(cleaner_id);
CREATE INDEX idx_nps_surveys_job ON public.nps_surveys(job_id);

-- Enable RLS on all tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nps_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings_ops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customers
CREATE POLICY "Organization members can view customers" ON public.customers
  FOR SELECT USING (
    organization_id IN (
      SELECT ur.company_id FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and dispatchers can manage customers" ON public.customers
  FOR ALL USING (
    organization_id IN (
      SELECT ur.company_id FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('owner', 'dispatcher')
    )
  );

-- RLS Policies for cleaners
CREATE POLICY "Organization members can view cleaners" ON public.cleaners
  FOR SELECT USING (
    organization_id IN (
      SELECT ur.company_id FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid()
    )
  );

CREATE POLICY "Cleaners can view their own data" ON public.cleaners
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Owners and dispatchers can manage cleaners" ON public.cleaners
  FOR ALL USING (
    organization_id IN (
      SELECT ur.company_id FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('owner', 'dispatcher')
    )
  );

-- RLS Policies for jobs
CREATE POLICY "Organization members can view jobs" ON public.jobs
  FOR SELECT USING (
    organization_id IN (
      SELECT ur.company_id FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid()
    )
  );

CREATE POLICY "Cleaners can view assigned jobs" ON public.jobs
  FOR SELECT USING (
    assigned_cleaner_id IN (
      SELECT c.id FROM public.cleaners c WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and dispatchers can manage jobs" ON public.jobs
  FOR ALL USING (
    organization_id IN (
      SELECT ur.company_id FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('owner', 'dispatcher')
    )
  );

-- RLS Policies for job_events
CREATE POLICY "Organization members can view job events" ON public.job_events
  FOR SELECT USING (
    organization_id IN (
      SELECT ur.company_id FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert job events" ON public.job_events
  FOR INSERT WITH CHECK (true);

-- RLS Policies for schedules
CREATE POLICY "Cleaners can manage their schedules" ON public.schedules
  FOR ALL USING (
    cleaner_id IN (
      SELECT c.id FROM public.cleaners c WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and dispatchers can view all schedules" ON public.schedules
  FOR SELECT USING (
    organization_id IN (
      SELECT ur.company_id FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('owner', 'dispatcher')
    )
  );

-- RLS Policies for payouts
CREATE POLICY "Cleaners can view their payouts" ON public.payouts
  FOR SELECT USING (
    cleaner_id IN (
      SELECT c.id FROM public.cleaners c WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY "Only owners can approve payouts" ON public.payouts
  FOR UPDATE USING (
    organization_id IN (
      SELECT ur.company_id FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'owner'
    )
  );

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER cleaners_updated_at BEFORE UPDATE ON public.cleaners
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER jobs_updated_at BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER settings_ops_updated_at BEFORE UPDATE ON public.settings_ops
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER invoices_updated_at BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER payouts_updated_at BEFORE UPDATE ON public.payouts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();