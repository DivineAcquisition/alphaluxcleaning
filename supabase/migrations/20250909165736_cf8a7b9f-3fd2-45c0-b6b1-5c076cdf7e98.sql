-- Subcontractor Management System - Core Schema
-- This creates a standalone, reusable system for managing subcontractors

-- Companies table (extend existing if needed)
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  timezone text DEFAULT 'America/Los_Angeles',
  plan text DEFAULT 'basic',
  brand_config jsonb DEFAULT '{"primary": "#A58FFF", "primaryDeep": "#6600FF"}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Extend subcontractors table with required fields
ALTER TABLE public.subcontractors 
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid,
ADD COLUMN IF NOT EXISTS active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS reliability_score numeric DEFAULT 100.0,
ADD COLUMN IF NOT EXISTS avg_duration_minutes integer DEFAULT 120,
ADD COLUMN IF NOT EXISTS jobs_completed_count integer DEFAULT 0;

-- Subcontractor availability (weekly schedule)
CREATE TABLE public.subcontractor_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subcontractor_id uuid NOT NULL REFERENCES public.subcontractors(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 1=Monday, etc.
  available boolean DEFAULT true,
  start_time time,
  end_time time,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(subcontractor_id, day_of_week)
);

-- Subcontractor time-off requests
CREATE TABLE public.subcontractor_timeoff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subcontractor_id uuid NOT NULL REFERENCES public.subcontractors(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  status text CHECK (status IN ('pending', 'approved', 'denied')) DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (end_date >= start_date)
);

-- Subcontractor service areas (ZIP codes)
CREATE TABLE public.subcontractor_service_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subcontractor_id uuid NOT NULL REFERENCES public.subcontractors(id) ON DELETE CASCADE,
  zip text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(subcontractor_id, zip)
);

-- Performance metrics (weekly rollups)
CREATE TABLE public.subcontractor_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subcontractor_id uuid NOT NULL REFERENCES public.subcontractors(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  acceptance_rate numeric DEFAULT 0.0,
  on_time_rate numeric DEFAULT 0.0,
  jobs_completed integer DEFAULT 0,
  avg_duration_minutes integer DEFAULT 0,
  avg_rating numeric DEFAULT 0.0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(subcontractor_id, period_start, period_end)
);

-- Services table with pricing and payout configuration
CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid,
  name text NOT NULL,
  description text,
  pricing_mode text CHECK (pricing_mode IN ('flat', 'hourly', 'calculator', 'tiered', 'sqft_tiered')) DEFAULT 'sqft_tiered',
  hourly_rate numeric DEFAULT 0,
  tiers jsonb DEFAULT '[]'::jsonb, -- Square footage tiers
  adders jsonb DEFAULT '[]'::jsonb, -- Add-on services
  profit_multiplier numeric DEFAULT 1.0,
  cleaning_speed_sqft_per_hour numeric DEFAULT 500, -- For time estimates
  
  -- Payout configuration
  payout_mode text CHECK (payout_mode IN ('hourly', 'flat', 'percent_of_quote')) DEFAULT 'percent_of_quote',
  payout_hourly_rate numeric DEFAULT 18.00,
  payout_flat_amount numeric DEFAULT 0,
  payout_percent numeric DEFAULT 65.0, -- 65% of quote
  
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Extend bookings table with pricing snapshots and payout data
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS entered_sqft integer,
ADD COLUMN IF NOT EXISTS sqft_tier_applied jsonb,
ADD COLUMN IF NOT EXISTS price_calc_meta jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS subcontractor_payout_mode text,
ADD COLUMN IF NOT EXISTS subcontractor_payout_amount numeric,
ADD COLUMN IF NOT EXISTS subcontractor_estimated_hours numeric,
ADD COLUMN IF NOT EXISTS service_id uuid REFERENCES public.services(id);

-- Checkpoints for proof of service (check-in/out)
CREATE TABLE public.checkpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid,
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  subcontractor_id uuid NOT NULL REFERENCES public.subcontractors(id),
  type text CHECK (type IN ('check_in', 'check_out')) NOT NULL,
  lat numeric,
  lng numeric,
  notes text,
  photos jsonb DEFAULT '[]'::jsonb, -- Array of photo URLs
  created_at timestamptz DEFAULT now()
);

-- Assignment tokens for secure invite links
CREATE TABLE public.assignment_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  subcontractor_id uuid NOT NULL REFERENCES public.subcontractors(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subcontractors_company_active ON public.subcontractors(company_id, active);
CREATE INDEX IF NOT EXISTS idx_subcontractor_availability_sub_id ON public.subcontractor_availability(subcontractor_id);
CREATE INDEX IF NOT EXISTS idx_subcontractor_timeoff_sub_date ON public.subcontractor_timeoff(subcontractor_id, start_date);
CREATE INDEX IF NOT EXISTS idx_subcontractor_service_areas_sub_zip ON public.subcontractor_service_areas(subcontractor_id, zip);
CREATE INDEX IF NOT EXISTS idx_subcontractor_metrics_sub_period ON public.subcontractor_metrics(subcontractor_id, period_start);
CREATE INDEX IF NOT EXISTS idx_bookings_company_sub_status ON public.bookings(company_id, assigned_employee_id, status);
CREATE INDEX IF NOT EXISTS idx_checkpoints_booking_sub ON public.checkpoints(booking_id, subcontractor_id);
CREATE INDEX IF NOT EXISTS idx_assignment_tokens_token ON public.assignment_tokens(token);

-- Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcontractor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcontractor_timeoff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcontractor_service_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcontractor_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_tokens ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is company admin
CREATE OR REPLACE FUNCTION public.is_company_user(company_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if authenticated user has admin role for this company
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'manager')
    AND ur.company_id = is_company_user.company_id
  );
END;
$$;

-- Helper function to get subcontractor's company
CREATE OR REPLACE FUNCTION public.get_subcontractor_company(sub_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.subcontractors WHERE id = sub_id;
$$;

-- RLS Policies for Companies
CREATE POLICY "Company admins can manage their company" ON public.companies
  FOR ALL USING (public.is_company_user(id));

-- RLS Policies for Subcontractor Availability
CREATE POLICY "Admins can manage subcontractor availability" ON public.subcontractor_availability
  FOR ALL USING (public.is_company_user(public.get_subcontractor_company(subcontractor_id)));

CREATE POLICY "Subcontractors can manage their own availability" ON public.subcontractor_availability
  FOR ALL USING (
    subcontractor_id IN (
      SELECT id FROM public.subcontractors 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for Time-off
CREATE POLICY "Admins can manage time-off requests" ON public.subcontractor_timeoff
  FOR ALL USING (public.is_company_user(public.get_subcontractor_company(subcontractor_id)));

CREATE POLICY "Subcontractors can manage their own time-off" ON public.subcontractor_timeoff
  FOR ALL USING (
    subcontractor_id IN (
      SELECT id FROM public.subcontractors 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for Service Areas
CREATE POLICY "Admins can manage service areas" ON public.subcontractor_service_areas
  FOR ALL USING (public.is_company_user(public.get_subcontractor_company(subcontractor_id)));

CREATE POLICY "Subcontractors can view their service areas" ON public.subcontractor_service_areas
  FOR SELECT USING (
    subcontractor_id IN (
      SELECT id FROM public.subcontractors 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for Metrics
CREATE POLICY "Admins can view all metrics" ON public.subcontractor_metrics
  FOR SELECT USING (public.is_company_user(public.get_subcontractor_company(subcontractor_id)));

CREATE POLICY "Subcontractors can view their own metrics" ON public.subcontractor_metrics
  FOR SELECT USING (
    subcontractor_id IN (
      SELECT id FROM public.subcontractors 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for Services
CREATE POLICY "Admins can manage services" ON public.services
  FOR ALL USING (public.is_company_user(company_id));

-- RLS Policies for Checkpoints
CREATE POLICY "Admins can view all checkpoints" ON public.checkpoints
  FOR SELECT USING (public.is_company_user(company_id));

CREATE POLICY "Subcontractors can manage their checkpoints" ON public.checkpoints
  FOR ALL USING (
    subcontractor_id IN (
      SELECT id FROM public.subcontractors 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for Assignment Tokens
CREATE POLICY "System can manage assignment tokens" ON public.assignment_tokens
  FOR ALL USING (true);

-- Storage bucket for job photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('job-photos', 'job-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for job photos
CREATE POLICY "Admins can access all job photos" ON storage.objects
  FOR ALL USING (
    bucket_id = 'job-photos' AND
    auth.uid() IN (
      SELECT ur.user_id FROM public.user_roles ur 
      WHERE ur.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Subcontractors can upload their job photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'job-photos' AND
    auth.uid() IN (
      SELECT s.user_id FROM public.subcontractors s
    )
  );

-- Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subcontractor_availability_updated_at
  BEFORE UPDATE ON public.subcontractor_availability
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subcontractor_timeoff_updated_at
  BEFORE UPDATE ON public.subcontractor_timeoff
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subcontractor_metrics_updated_at
  BEFORE UPDATE ON public.subcontractor_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();