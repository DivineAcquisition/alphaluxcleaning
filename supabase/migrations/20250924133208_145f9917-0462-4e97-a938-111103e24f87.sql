-- Create Housecall Pro sync logging table
CREATE TABLE public.hcp_sync_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL,
  hcp_customer_id TEXT,
  hcp_job_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hcp_sync_log ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage sync logs
CREATE POLICY "Admins can manage HCP sync logs" 
ON public.hcp_sync_log 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

-- Add foreign key reference to bookings
ALTER TABLE public.hcp_sync_log 
ADD CONSTRAINT hcp_sync_log_booking_id_fkey 
FOREIGN KEY (booking_id) REFERENCES public.bookings(id);

-- Create index for efficient lookups
CREATE INDEX idx_hcp_sync_log_booking_id ON public.hcp_sync_log(booking_id);
CREATE INDEX idx_hcp_sync_log_status ON public.hcp_sync_log(status);

-- Add HCP fields to bookings table
ALTER TABLE public.bookings 
ADD COLUMN hcp_customer_id TEXT,
ADD COLUMN hcp_job_id TEXT;

-- Create trigger for updated_at
CREATE TRIGGER update_hcp_sync_log_updated_at
BEFORE UPDATE ON public.hcp_sync_log
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();