-- Phase 1B: Create Core Tables with RLS Policies

-- Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT,
  last_name TEXT,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  address_json JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  company_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000'
);

-- Create cleaners table
CREATE TABLE IF NOT EXISTS public.cleaners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'active',
  pay_value NUMERIC DEFAULT 0,
  rating NUMERIC DEFAULT 5.0,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  company_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000'
);

-- Create jobs table
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

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_company ON public.customers(company_id);
CREATE INDEX IF NOT EXISTS idx_cleaners_email ON public.cleaners(email);
CREATE INDEX IF NOT EXISTS idx_cleaners_company ON public.cleaners(company_id);
CREATE INDEX IF NOT EXISTS idx_cleaners_status ON public.cleaners(status);
CREATE INDEX IF NOT EXISTS idx_jobs_company ON public.jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_date ON public.jobs(date_iso);
CREATE INDEX IF NOT EXISTS idx_jobs_assigned_cleaner ON public.jobs(assigned_cleaner_id);
CREATE INDEX IF NOT EXISTS idx_jobs_customer ON public.jobs(customer_id);

-- Enable RLS on all tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customers table
CREATE POLICY "owners_dispatchers_can_manage_customers" ON public.customers
  FOR ALL USING (
    company_id IN (
      SELECT ur.company_id FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('owner', 'dispatcher', 'super_admin')
    )
  );

-- RLS Policies for cleaners table  
CREATE POLICY "owners_dispatchers_can_manage_cleaners" ON public.cleaners
  FOR ALL USING (
    company_id IN (
      SELECT ur.company_id FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('owner', 'dispatcher', 'super_admin')
    )
  );

CREATE POLICY "cleaners_can_view_own_data" ON public.cleaners
  FOR SELECT USING (user_id = auth.uid());

-- RLS Policies for jobs table
CREATE POLICY "owners_dispatchers_can_manage_jobs" ON public.jobs
  FOR ALL USING (
    company_id IN (
      SELECT ur.company_id FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('owner', 'dispatcher', 'super_admin')
    )
  );

CREATE POLICY "cleaners_can_view_assigned_jobs" ON public.jobs
  FOR SELECT USING (
    assigned_cleaner_id IN (
      SELECT c.id FROM public.cleaners c WHERE c.user_id = auth.uid()
    )
  );

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customers_updated_at 
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER cleaners_updated_at 
  BEFORE UPDATE ON public.cleaners
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER jobs_updated_at 
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();