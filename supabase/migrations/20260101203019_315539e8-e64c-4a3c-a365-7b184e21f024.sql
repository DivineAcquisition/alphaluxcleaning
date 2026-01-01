-- Create partial_bookings table to track booking funnel progress for abandoned checkout detection
CREATE TABLE public.partial_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  zip_code TEXT,
  city TEXT,
  state TEXT,
  home_size TEXT,
  service_type TEXT,
  frequency TEXT,
  preferred_date TEXT,
  preferred_time TEXT,
  base_price NUMERIC,
  last_step TEXT NOT NULL DEFAULT 'lead_captured',
  session_id TEXT,
  utms JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  email_sent_1h BOOLEAN DEFAULT FALSE,
  email_sent_24h BOOLEAN DEFAULT FALSE,
  converted_booking_id UUID REFERENCES public.bookings(id)
);

-- Add index for abandoned checkout queries
CREATE INDEX idx_partial_bookings_abandoned ON public.partial_bookings(last_step, created_at, email_sent_1h, email_sent_24h) 
WHERE completed_at IS NULL;

-- Add index for email lookup
CREATE INDEX idx_partial_bookings_email ON public.partial_bookings(email);

-- Enable RLS
ALTER TABLE public.partial_bookings ENABLE ROW LEVEL SECURITY;

-- Allow public insert/update for tracking (no auth required for booking flow)
CREATE POLICY "Allow public insert for booking tracking" 
ON public.partial_bookings 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update for booking tracking" 
ON public.partial_bookings 
FOR UPDATE 
USING (true);

-- Only service role can read (for processing abandoned checkouts)
CREATE POLICY "Service role can read partial bookings" 
ON public.partial_bookings 
FOR SELECT 
USING (auth.role() = 'service_role');

-- Add trigger for updated_at
CREATE TRIGGER update_partial_bookings_updated_at
BEFORE UPDATE ON public.partial_bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();