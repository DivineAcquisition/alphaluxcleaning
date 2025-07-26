-- Create subcontractor applications table
CREATE TABLE public.subcontractor_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  has_drivers_license BOOLEAN NOT NULL DEFAULT false,
  has_own_vehicle BOOLEAN NOT NULL DEFAULT false,
  
  -- Application questions
  why_join_us TEXT NOT NULL,
  previous_cleaning_experience TEXT,
  availability TEXT NOT NULL,
  preferred_work_areas TEXT,
  emergency_contact_name TEXT NOT NULL,
  emergency_contact_phone TEXT NOT NULL,
  can_lift_heavy_items BOOLEAN NOT NULL DEFAULT false,
  comfortable_with_chemicals BOOLEAN NOT NULL DEFAULT false,
  reliable_transportation BOOLEAN NOT NULL DEFAULT false,
  background_check_consent BOOLEAN NOT NULL DEFAULT false,
  
  -- Consent and agreements
  brand_shirt_consent BOOLEAN NOT NULL DEFAULT false,
  subcontractor_agreement_consent BOOLEAN NOT NULL DEFAULT false,
  
  -- Application status
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subcontractor_applications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can submit applications" 
ON public.subcontractor_applications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all applications" 
ON public.subcontractor_applications 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'employee'::app_role));

CREATE POLICY "Admins can update applications" 
ON public.subcontractor_applications 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'employee'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_subcontractor_applications_updated_at
BEFORE UPDATE ON public.subcontractor_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();