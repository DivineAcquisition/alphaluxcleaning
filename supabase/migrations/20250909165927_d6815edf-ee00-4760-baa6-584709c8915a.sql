-- Subcontractor Management System - Add Missing Tables and Functions Only
-- Check and add only what doesn't exist

-- Create companies table if not exists (may need this for multi-tenant)
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

-- Add missing columns to existing subcontractors table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subcontractors' AND column_name = 'company_id') THEN
    ALTER TABLE public.subcontractors ADD COLUMN company_id uuid REFERENCES public.companies(id) DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subcontractors' AND column_name = 'active') THEN
    ALTER TABLE public.subcontractors ADD COLUMN active boolean DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subcontractors' AND column_name = 'reliability_score') THEN
    ALTER TABLE public.subcontractors ADD COLUMN reliability_score numeric DEFAULT 100.0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subcontractors' AND column_name = 'avg_duration_minutes') THEN
    ALTER TABLE public.subcontractors ADD COLUMN avg_duration_minutes integer DEFAULT 120;
  END IF;
END $$;

-- Create missing tables
CREATE TABLE IF NOT EXISTS public.subcontractor_timeoff (
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

CREATE TABLE IF NOT EXISTS public.subcontractor_service_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subcontractor_id uuid NOT NULL REFERENCES public.subcontractors(id) ON DELETE CASCADE,
  zip text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(subcontractor_id, zip)
);

CREATE TABLE IF NOT EXISTS public.subcontractor_metrics (
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

CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid,
  name text NOT NULL,
  description text,
  pricing_mode text CHECK (pricing_mode IN ('flat', 'hourly', 'calculator', 'tiered', 'sqft_tiered')) DEFAULT 'sqft_tiered',
  hourly_rate numeric DEFAULT 0,
  tiers jsonb DEFAULT '[]'::jsonb,
  adders jsonb DEFAULT '[]'::jsonb,
  profit_multiplier numeric DEFAULT 1.0,
  cleaning_speed_sqft_per_hour numeric DEFAULT 500,
  payout_mode text CHECK (payout_mode IN ('hourly', 'flat', 'percent_of_quote')) DEFAULT 'percent_of_quote',
  payout_hourly_rate numeric DEFAULT 18.00,
  payout_flat_amount numeric DEFAULT 0,
  payout_percent numeric DEFAULT 65.0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.checkpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid,
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  subcontractor_id uuid NOT NULL REFERENCES public.subcontractors(id),
  type text CHECK (type IN ('check_in', 'check_out')) NOT NULL,
  lat numeric,
  lng numeric,
  notes text,
  photos jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.assignment_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  subcontractor_id uuid NOT NULL REFERENCES public.subcontractors(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Add columns to bookings table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'entered_sqft') THEN
    ALTER TABLE public.bookings ADD COLUMN entered_sqft integer;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'price_calc_meta') THEN
    ALTER TABLE public.bookings ADD COLUMN price_calc_meta jsonb DEFAULT '{}'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'subcontractor_payout_mode') THEN
    ALTER TABLE public.bookings ADD COLUMN subcontractor_payout_mode text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'subcontractor_payout_amount') THEN
    ALTER TABLE public.bookings ADD COLUMN subcontractor_payout_amount numeric;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'service_id') THEN
    ALTER TABLE public.bookings ADD COLUMN service_id uuid REFERENCES public.services(id);
  END IF;
END $$;

-- Storage bucket for job photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('job-photos', 'job-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Core server functions for the subcontractor system
CREATE OR REPLACE FUNCTION public.get_eligible_subcontractors(
  p_company_id uuid,
  p_booking_id uuid,
  p_service_date date,
  p_start_time time,
  p_end_time time,
  p_zip text
)
RETURNS TABLE (
  id uuid,
  full_name text,
  email text,
  phone text,
  reliability_score numeric,
  distance_score numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.full_name,
    s.email,
    s.phone,
    COALESCE(s.reliability_score, 100.0) as reliability_score,
    1.0 as distance_score -- Simplified for now
  FROM public.subcontractors s
  LEFT JOIN public.subcontractor_availability sa ON s.id = sa.subcontractor_id 
    AND sa.day_of_week = EXTRACT(DOW FROM p_service_date)
  LEFT JOIN public.subcontractor_service_areas ssa ON s.id = ssa.subcontractor_id
  LEFT JOIN public.subcontractor_timeoff st ON s.id = st.subcontractor_id 
    AND p_service_date BETWEEN st.start_date AND st.end_date 
    AND st.status = 'approved'
  WHERE 
    s.company_id = p_company_id
    AND s.active = true
    AND st.id IS NULL -- Not on time off
    AND (sa.available = true OR sa.available IS NULL) -- Available or no schedule set
    AND (ssa.zip = p_zip OR ssa.zip IS NULL) -- In service area or no areas set
    AND (
      sa.start_time IS NULL OR sa.end_time IS NULL OR
      (sa.start_time <= p_start_time AND sa.end_time >= p_end_time)
    ) -- Available during requested time
  ORDER BY 
    COALESCE(s.reliability_score, 100.0) DESC,
    s.created_at ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_quote_snapshot(
  p_service_id uuid,
  p_sqft integer,
  p_addons jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_service RECORD;
  v_base_price numeric := 0;
  v_addon_price numeric := 0;
  v_total numeric := 0;
  v_tier jsonb;
  v_addon jsonb;
BEGIN
  -- Get service configuration
  SELECT * INTO v_service FROM public.services WHERE id = p_service_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Service not found');
  END IF;
  
  -- Calculate base price based on pricing mode
  IF v_service.pricing_mode = 'sqft_tiered' AND p_sqft > 0 THEN
    -- Find appropriate tier
    FOR v_tier IN SELECT * FROM jsonb_array_elements(v_service.tiers)
    LOOP
      IF (v_tier->>'min_sqft')::integer <= p_sqft AND 
         (v_tier->>'max_sqft')::integer >= p_sqft THEN
        v_base_price := (v_tier->>'price_per_sqft')::numeric * p_sqft + 
                       COALESCE((v_tier->>'base_fee')::numeric, 0);
        EXIT;
      END IF;
    END LOOP;
    
    -- Apply profit multiplier
    v_base_price := v_base_price * COALESCE(v_service.profit_multiplier, 1.0);
    
  ELSIF v_service.pricing_mode = 'flat' THEN
    v_base_price := COALESCE(v_service.hourly_rate, 0); -- Using hourly_rate field for flat rate
    
  ELSIF v_service.pricing_mode = 'hourly' THEN
    -- Estimate hours based on sqft and cleaning speed
    v_base_price := (p_sqft::numeric / COALESCE(v_service.cleaning_speed_sqft_per_hour, 500)) * 
                   COALESCE(v_service.hourly_rate, 0);
  END IF;
  
  -- Calculate addon prices
  FOR v_addon IN SELECT * FROM jsonb_array_elements(p_addons)
  LOOP
    v_addon_price := v_addon_price + COALESCE((v_addon->>'price')::numeric, 0);
  END LOOP;
  
  v_total := v_base_price + v_addon_price;
  
  RETURN jsonb_build_object(
    'base_price', v_base_price,
    'addon_price', v_addon_price,
    'total', v_total,
    'service_id', p_service_id,
    'sqft', p_sqft,
    'pricing_mode', v_service.pricing_mode,
    'calculated_at', now()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.compute_payout(
  p_service_id uuid,
  p_quote_total numeric,
  p_sqft integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_service RECORD;
  v_payout_amount numeric := 0;
  v_estimated_hours numeric := 2.0; -- Default
BEGIN
  SELECT * INTO v_service FROM public.services WHERE id = p_service_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Service not found');
  END IF;
  
  -- Calculate estimated hours if sqft provided
  IF p_sqft > 0 AND v_service.cleaning_speed_sqft_per_hour > 0 THEN
    v_estimated_hours := p_sqft::numeric / v_service.cleaning_speed_sqft_per_hour;
  END IF;
  
  -- Calculate payout based on mode
  IF v_service.payout_mode = 'hourly' THEN
    v_payout_amount := v_estimated_hours * COALESCE(v_service.payout_hourly_rate, 18.00);
    
  ELSIF v_service.payout_mode = 'flat' THEN
    v_payout_amount := COALESCE(v_service.payout_flat_amount, 0);
    
  ELSIF v_service.payout_mode = 'percent_of_quote' THEN
    v_payout_amount := p_quote_total * (COALESCE(v_service.payout_percent, 65.0) / 100.0);
  END IF;
  
  RETURN jsonb_build_object(
    'payout_amount', v_payout_amount,
    'payout_mode', v_service.payout_mode,
    'estimated_hours', v_estimated_hours,
    'calculated_at', now()
  );
END;
$$;