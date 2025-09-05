-- Create tables for Phase 3 enhanced features (corrected)

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

-- Photo management for jobs
CREATE TABLE IF NOT EXISTS public.job_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_tracking_id UUID,
  assignment_id UUID,
  photo_url TEXT NOT NULL,
  photo_type TEXT NOT NULL CHECK (photo_type IN ('arrival', 'progress', 'completion', 'before', 'after')),
  caption TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Automation rules engine
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
  created_by UUID NOT NULL
);

-- Performance scorecards and analytics
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

-- Storage bucket for job photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('job-photos', 'job-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.job_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_assignment_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcontractor_performance_metrics ENABLE ROW LEVEL SECURITY;

-- RLS policies for job_tracking
CREATE POLICY "Subcontractors can manage their own job tracking" 
ON public.job_tracking 
FOR ALL 
USING (true); -- Simplified for now, will enhance with proper auth

CREATE POLICY "System can manage job tracking" 
ON public.job_tracking 
FOR ALL 
USING (true)
WITH CHECK (true);

-- RLS policies for job_photos
CREATE POLICY "Users can manage their job photos" 
ON public.job_photos 
FOR ALL 
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- RLS policies for automation rules
CREATE POLICY "System can manage automation rules" 
ON public.automation_assignment_rules 
FOR ALL 
USING (true)
WITH CHECK (true);

-- RLS policies for performance metrics
CREATE POLICY "System can manage performance metrics" 
ON public.subcontractor_performance_metrics 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Storage policies for job photos
CREATE POLICY "Authenticated users can upload job photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'job-photos' AND 
  auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can view job photos" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'job-photos' AND 
  auth.uid() IS NOT NULL
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_tracking_assignment_id ON public.job_tracking(assignment_id);
CREATE INDEX IF NOT EXISTS idx_job_tracking_subcontractor_id ON public.job_tracking(subcontractor_id);
CREATE INDEX IF NOT EXISTS idx_job_photos_assignment_id ON public.job_photos(assignment_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_subcontractor_date ON public.subcontractor_performance_metrics(subcontractor_id, metric_date);
CREATE INDEX IF NOT EXISTS idx_automation_rules_active ON public.automation_assignment_rules(is_active, priority);

-- Triggers for updated_at timestamps
CREATE TRIGGER update_job_tracking_updated_at
BEFORE UPDATE ON public.job_tracking
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_automation_rules_updated_at
BEFORE UPDATE ON public.automation_assignment_rules
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_performance_metrics_updated_at
BEFORE UPDATE ON public.subcontractor_performance_metrics
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();