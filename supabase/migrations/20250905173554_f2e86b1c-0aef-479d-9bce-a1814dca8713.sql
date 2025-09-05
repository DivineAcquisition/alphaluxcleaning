-- Create core Phase 3 tables (simplified)

-- Enhanced job tracking with check-in/out functionality
CREATE TABLE IF NOT EXISTS public.job_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID,
  subcontractor_id UUID,
  order_id UUID,
  check_in_time TIMESTAMP WITH TIME ZONE,
  check_out_time TIMESTAMP WITH TIME ZONE,
  check_in_location TEXT,
  check_out_location TEXT,
  photos JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Job photos table
CREATE TABLE IF NOT EXISTS public.job_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID,
  photo_url TEXT NOT NULL,
  photo_type TEXT NOT NULL CHECK (photo_type IN ('arrival', 'progress', 'completion', 'before', 'after')),
  caption TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Automation assignment rules
CREATE TABLE IF NOT EXISTS public.automation_assignment_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 1,
  conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
  actions JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Performance metrics table
CREATE TABLE IF NOT EXISTS public.subcontractor_performance_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subcontractor_id UUID NOT NULL,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  assignments_received INTEGER DEFAULT 0,
  assignments_accepted INTEGER DEFAULT 0,
  assignments_completed INTEGER DEFAULT 0,
  avg_response_time_minutes NUMERIC,
  customer_rating_avg NUMERIC,
  on_time_percentage NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(subcontractor_id, metric_date)
);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('job-photos', 'job-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Basic indexes
CREATE INDEX IF NOT EXISTS idx_job_tracking_assignment_id ON public.job_tracking(assignment_id);
CREATE INDEX IF NOT EXISTS idx_job_photos_assignment_id ON public.job_photos(assignment_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_subcontractor_date ON public.subcontractor_performance_metrics(subcontractor_id, metric_date);