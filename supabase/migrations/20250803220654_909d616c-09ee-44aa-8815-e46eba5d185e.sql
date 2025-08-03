-- Create missing tables for office manager functionality

-- Performance metrics table
CREATE TABLE public.performance_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subcontractor_id UUID REFERENCES public.subcontractors(id) ON DELETE CASCADE,
  month_year DATE NOT NULL,
  jobs_completed INTEGER DEFAULT 0,
  on_time_percentage NUMERIC(5,2) DEFAULT 0,
  customer_rating NUMERIC(3,2) DEFAULT 0,
  complaints_count INTEGER DEFAULT 0,
  bonus_eligible BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Incidents tracking table
CREATE TABLE public.incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subcontractor_id UUID REFERENCES public.subcontractors(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  incident_type TEXT NOT NULL CHECK (incident_type IN ('late_arrival', 'no_show', 'customer_complaint', 'quality_issue', 'equipment_damage')),
  description TEXT,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  reported_by UUID REFERENCES auth.users(id),
  incident_date TIMESTAMP WITH TIME ZONE NOT NULL,
  resolution TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Customer feedback/quality reports table
CREATE TABLE public.customer_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  subcontractor_id UUID REFERENCES public.subcontractors(id) ON DELETE SET NULL,
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  cleanliness_rating INTEGER CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
  timeliness_rating INTEGER CHECK (timeliness_rating >= 1 AND timeliness_rating <= 5),
  professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
  feedback_text TEXT,
  photos JSONB DEFAULT '[]'::jsonb,
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'complaint', 'compliment', 'suggestion')),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'responded', 'resolved')),
  response_text TEXT,
  responded_by UUID REFERENCES auth.users(id),
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Job check-in/check-out tracking
CREATE TABLE public.job_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID REFERENCES public.subcontractor_job_assignments(id) ON DELETE CASCADE,
  check_in_time TIMESTAMP WITH TIME ZONE,
  check_in_location TEXT,
  check_out_time TIMESTAMP WITH TIME ZONE,
  check_out_location TEXT,
  actual_duration INTERVAL,
  notes TEXT,
  photos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for performance_metrics
CREATE POLICY "Admins can manage performance metrics" ON public.performance_metrics
FOR ALL USING (true);

CREATE POLICY "Subcontractors can view their own metrics" ON public.performance_metrics
FOR SELECT USING (subcontractor_id IN (
  SELECT id FROM public.subcontractors WHERE user_id = auth.uid()
));

-- RLS Policies for incidents
CREATE POLICY "Admins can manage incidents" ON public.incidents
FOR ALL USING (true);

CREATE POLICY "Subcontractors can view incidents about them" ON public.incidents
FOR SELECT USING (subcontractor_id IN (
  SELECT id FROM public.subcontractors WHERE user_id = auth.uid()
));

-- RLS Policies for customer_feedback
CREATE POLICY "Admins can manage customer feedback" ON public.customer_feedback
FOR ALL USING (true);

CREATE POLICY "Subcontractors can view feedback about them" ON public.customer_feedback
FOR SELECT USING (subcontractor_id IN (
  SELECT id FROM public.subcontractors WHERE user_id = auth.uid()
));

-- RLS Policies for job_tracking
CREATE POLICY "Admins can manage job tracking" ON public.job_tracking
FOR ALL USING (true);

CREATE POLICY "Subcontractors can manage their own job tracking" ON public.job_tracking
FOR ALL USING (assignment_id IN (
  SELECT sja.id FROM public.subcontractor_job_assignments sja
  JOIN public.subcontractors s ON sja.subcontractor_id = s.id
  WHERE s.user_id = auth.uid()
));

-- Add some indexes for better performance
CREATE INDEX idx_performance_metrics_subcontractor ON public.performance_metrics(subcontractor_id);
CREATE INDEX idx_incidents_subcontractor ON public.incidents(subcontractor_id);
CREATE INDEX idx_incidents_date ON public.incidents(incident_date);
CREATE INDEX idx_customer_feedback_booking ON public.customer_feedback(booking_id);
CREATE INDEX idx_customer_feedback_subcontractor ON public.customer_feedback(subcontractor_id);
CREATE INDEX idx_job_tracking_assignment ON public.job_tracking(assignment_id);

-- Create triggers for updated_at
CREATE TRIGGER update_performance_metrics_updated_at
BEFORE UPDATE ON public.performance_metrics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_incidents_updated_at
BEFORE UPDATE ON public.incidents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_feedback_updated_at
BEFORE UPDATE ON public.customer_feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_tracking_updated_at
BEFORE UPDATE ON public.job_tracking
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();