-- Add new fields to subcontractor_applications table for enhanced application process
ALTER TABLE public.subcontractor_applications 
ADD COLUMN drivers_license_image_url TEXT,
ADD COLUMN address TEXT,
ADD COLUMN city TEXT, 
ADD COLUMN state TEXT,
ADD COLUMN zip_code TEXT;

-- Create new table for subcontractor profile information
CREATE TABLE public.subcontractor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcontractor_id UUID REFERENCES public.subcontractors(id) ON DELETE CASCADE,
  profile_image_url TEXT,
  biography TEXT,
  legal_name TEXT,
  date_of_birth DATE,
  ssn_last_four TEXT, -- Store only last 4 digits for security
  account_number_last_four TEXT, -- Store only last 4 digits for security
  routing_number TEXT,
  background_check_consent BOOLEAN DEFAULT false,
  background_check_copy_consent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on the new table
ALTER TABLE public.subcontractor_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for subcontractor profiles
CREATE POLICY "Subcontractors can view their own profile" 
ON public.subcontractor_profiles 
FOR SELECT 
USING (subcontractor_id IN (
  SELECT id FROM public.subcontractors 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Subcontractors can update their own profile" 
ON public.subcontractor_profiles 
FOR UPDATE 
USING (subcontractor_id IN (
  SELECT id FROM public.subcontractors 
  WHERE user_id = auth.uid()
));

CREATE POLICY "System can insert profiles" 
ON public.subcontractor_profiles 
FOR INSERT 
WITH CHECK (true);

-- Create trigger for updating timestamps
CREATE TRIGGER update_subcontractor_profiles_updated_at
BEFORE UPDATE ON public.subcontractor_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();