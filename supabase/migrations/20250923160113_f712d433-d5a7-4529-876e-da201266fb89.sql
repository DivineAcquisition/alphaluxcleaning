-- Create email system tables for AlphaLuxClean
CREATE TABLE IF NOT EXISTS public.email_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  to_email TEXT NOT NULL,
  template TEXT NOT NULL,
  payload_json JSONB NOT NULL DEFAULT '{}',
  category TEXT NOT NULL DEFAULT 'transactional',
  status TEXT NOT NULL DEFAULT 'queued',
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  event_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  to_email TEXT NOT NULL,
  template TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'sendgrid',
  event TEXT NOT NULL,
  message_id TEXT,
  metadata_json JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  link TEXT NOT NULL,
  credits_earned NUMERIC DEFAULT 0,
  credits_used NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add new columns to bookings for email system
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Chicago',
ADD COLUMN IF NOT EXISTS receipt_url TEXT,
ADD COLUMN IF NOT EXISTS marketing_opt_in BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS email_bounced_at TIMESTAMP WITH TIME ZONE;

-- Enable RLS
ALTER TABLE public.email_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Create policies for email_jobs
CREATE POLICY "Admins can manage all email jobs" 
ON public.email_jobs 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- Create policies for email_events
CREATE POLICY "Admins can view all email events" 
ON public.email_events 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- Create policies for referrals
CREATE POLICY "Users can view their own referrals" 
ON public.referrals 
FOR SELECT 
USING (customer_id IN (
  SELECT id FROM public.customers WHERE user_id = auth.uid()
));

CREATE POLICY "Admins can manage all referrals" 
ON public.referrals 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_jobs_status ON public.email_jobs(status);
CREATE INDEX IF NOT EXISTS idx_email_jobs_created_at ON public.email_jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_email_events_created_at ON public.email_events(created_at);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON public.referrals(code);

-- Create function to update email jobs updated_at
CREATE OR REPLACE FUNCTION public.update_email_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for email jobs
CREATE TRIGGER update_email_jobs_updated_at
BEFORE UPDATE ON public.email_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_email_jobs_updated_at();

-- Create trigger for referrals
CREATE TRIGGER update_referrals_updated_at
BEFORE UPDATE ON public.referrals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();