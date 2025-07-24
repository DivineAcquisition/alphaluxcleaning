-- Create commercial_estimates table for estimate requests
CREATE TABLE public.commercial_estimates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name TEXT NOT NULL,
  business_type TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  square_footage INTEGER NOT NULL,
  number_of_floors INTEGER NOT NULL DEFAULT 1,
  number_of_restrooms INTEGER NOT NULL DEFAULT 1,
  number_of_offices INTEGER NOT NULL DEFAULT 1,
  service_type TEXT NOT NULL CHECK (service_type IN ('commercial', 'office')),
  cleaning_type TEXT NOT NULL,
  frequency TEXT NOT NULL,
  preferred_time TEXT,
  special_requirements TEXT,
  preferred_walkthrough_date TEXT NOT NULL,
  preferred_walkthrough_time TEXT NOT NULL,
  alternative_date TEXT,
  alternative_time TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'scheduled', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.commercial_estimates ENABLE ROW LEVEL SECURITY;

-- Create policies (public access since these are estimate requests)
CREATE POLICY "Anyone can insert commercial estimates" 
ON public.commercial_estimates 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view commercial estimates" 
ON public.commercial_estimates 
FOR SELECT 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_commercial_estimates_updated_at
  BEFORE UPDATE ON public.commercial_estimates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();