-- Fix security issues - Add missing RLS policies for new tables

-- Enable RLS on new tables (in case not enabled)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcontractor_timeoff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcontractor_service_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcontractor_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Companies
CREATE POLICY "Admins can manage companies" ON public.companies
  FOR ALL USING (
    auth.uid() IN (
      SELECT ur.user_id FROM public.user_roles ur 
      WHERE ur.role IN ('admin', 'manager') 
      AND ur.company_id = companies.id
    )
  );

-- RLS Policies for Subcontractor Time-off
CREATE POLICY "Admins can manage timeoff" ON public.subcontractor_timeoff
  FOR ALL USING (
    auth.uid() IN (
      SELECT ur.user_id FROM public.user_roles ur 
      JOIN public.subcontractors s ON ur.company_id = s.company_id
      WHERE ur.role IN ('admin', 'manager') 
      AND s.id = subcontractor_timeoff.subcontractor_id
    ) OR 
    subcontractor_id IN (
      SELECT id FROM public.subcontractors 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for Service Areas
CREATE POLICY "Admins can manage service areas" ON public.subcontractor_service_areas
  FOR ALL USING (
    auth.uid() IN (
      SELECT ur.user_id FROM public.user_roles ur 
      JOIN public.subcontractors s ON ur.company_id = s.company_id
      WHERE ur.role IN ('admin', 'manager') 
      AND s.id = subcontractor_service_areas.subcontractor_id
    ) OR 
    subcontractor_id IN (
      SELECT id FROM public.subcontractors 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for Metrics (read-only for subcontractors)
CREATE POLICY "Admins can manage metrics" ON public.subcontractor_metrics
  FOR ALL USING (
    auth.uid() IN (
      SELECT ur.user_id FROM public.user_roles ur 
      JOIN public.subcontractors s ON ur.company_id = s.company_id
      WHERE ur.role IN ('admin', 'manager') 
      AND s.id = subcontractor_metrics.subcontractor_id
    )
  );

CREATE POLICY "Subcontractors can view their metrics" ON public.subcontractor_metrics
  FOR SELECT USING (
    subcontractor_id IN (
      SELECT id FROM public.subcontractors 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for Services
CREATE POLICY "Admins can manage services" ON public.services
  FOR ALL USING (
    auth.uid() IN (
      SELECT ur.user_id FROM public.user_roles ur 
      WHERE ur.role IN ('admin', 'manager') 
      AND ur.company_id = services.company_id
    )
  );

-- RLS Policies for Checkpoints
CREATE POLICY "Admins can view checkpoints" ON public.checkpoints
  FOR SELECT USING (
    auth.uid() IN (
      SELECT ur.user_id FROM public.user_roles ur 
      WHERE ur.role IN ('admin', 'manager') 
      AND ur.company_id = checkpoints.company_id
    )
  );

CREATE POLICY "Subcontractors can manage their checkpoints" ON public.checkpoints
  FOR ALL USING (
    subcontractor_id IN (
      SELECT id FROM public.subcontractors 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for Assignment Tokens (system managed)
CREATE POLICY "System manages assignment tokens" ON public.assignment_tokens
  FOR ALL USING (true);

-- Storage policies for job photos
CREATE POLICY "Admins can view job photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'job-photos' AND
    auth.uid() IN (
      SELECT ur.user_id FROM public.user_roles ur 
      WHERE ur.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Subcontractors can upload job photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'job-photos' AND
    auth.uid() IN (
      SELECT s.user_id FROM public.subcontractors s
    )
  );

CREATE POLICY "Subcontractors can view their job photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'job-photos' AND
    auth.uid() IN (
      SELECT s.user_id FROM public.subcontractors s
    )
  );