-- Create expansion waitlist table
CREATE TABLE public.expansion_waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notified BOOLEAN DEFAULT FALSE,
  
  -- Prevent duplicate entries for same email/zip combination
  UNIQUE(email, zip_code)
);

-- Enable Row Level Security
ALTER TABLE public.expansion_waitlist ENABLE ROW LEVEL SECURITY;

-- Create policy for anonymous users to insert (no authentication required for waitlist)
CREATE POLICY "Anyone can join expansion waitlist" 
ON public.expansion_waitlist 
FOR INSERT 
WITH CHECK (true);

-- Create policy for admins to view waitlist data
CREATE POLICY "Admins can view expansion waitlist" 
ON public.expansion_waitlist 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Create index for efficient querying
CREATE INDEX idx_expansion_waitlist_zip_code ON public.expansion_waitlist(zip_code);
CREATE INDEX idx_expansion_waitlist_created_at ON public.expansion_waitlist(created_at DESC);
CREATE INDEX idx_expansion_waitlist_notified ON public.expansion_waitlist(notified) WHERE notified = false;