-- Enable RLS on tables that currently have it disabled
ALTER TABLE public.automation_assignment_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcontractor_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Security policies for automation_assignment_rules (admin-only functionality)
CREATE POLICY "Admins can manage automation assignment rules" 
ON public.automation_assignment_rules 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'::app_role)) 
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Security policies for job_photos (linked through job_assignments)
CREATE POLICY "Admins can manage all job photos" 
ON public.job_photos 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'::app_role)) 
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Contractors can view photos for their job assignments" 
ON public.job_photos 
FOR SELECT 
USING (
  assignment_id IN (
    SELECT ja.id 
    FROM job_assignments ja 
    JOIN subcontractors s ON ja.contractor_id = s.id 
    WHERE s.user_id = auth.uid()
  ) OR
  assignment_id IN (
    SELECT sja.id 
    FROM subcontractor_job_assignments sja 
    JOIN subcontractors s ON sja.subcontractor_id = s.id 
    WHERE s.user_id = auth.uid()
  )
);

CREATE POLICY "Contractors can upload photos for their job assignments" 
ON public.job_photos 
FOR INSERT 
WITH CHECK (
  assignment_id IN (
    SELECT ja.id 
    FROM job_assignments ja 
    JOIN subcontractors s ON ja.contractor_id = s.id 
    WHERE s.user_id = auth.uid()
  ) OR
  assignment_id IN (
    SELECT sja.id 
    FROM subcontractor_job_assignments sja 
    JOIN subcontractors s ON sja.subcontractor_id = s.id 
    WHERE s.user_id = auth.uid()
  )
);

-- Security policies for subcontractor_performance_metrics
CREATE POLICY "Admins can manage all performance metrics" 
ON public.subcontractor_performance_metrics 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'::app_role)) 
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Subcontractors can view their own performance metrics" 
ON public.subcontractor_performance_metrics 
FOR SELECT 
USING (
  subcontractor_id IN (
    SELECT id FROM subcontractors WHERE user_id = auth.uid()
  )
);

CREATE POLICY "System can insert performance metrics" 
ON public.subcontractor_performance_metrics 
FOR INSERT 
WITH CHECK (true);