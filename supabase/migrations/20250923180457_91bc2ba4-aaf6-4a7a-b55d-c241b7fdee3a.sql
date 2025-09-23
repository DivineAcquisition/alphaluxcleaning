-- Create admin OTP tracking table
CREATE TABLE public.admin_otp_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  verified_at TIMESTAMP WITH TIME ZONE NULL
);

-- Enable Row Level Security
ALTER TABLE public.admin_otp_codes ENABLE ROW LEVEL SECURITY;

-- Create policy for service role access only (used by edge functions)
CREATE POLICY "Service role can manage admin OTP codes" 
ON public.admin_otp_codes 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create index for efficient lookups
CREATE INDEX idx_admin_otp_codes_email_code ON public.admin_otp_codes(email, code);
CREATE INDEX idx_admin_otp_codes_expires_at ON public.admin_otp_codes(expires_at);

-- Create function to clean up expired codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_admin_otp_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.admin_otp_codes 
  WHERE expires_at < now() - INTERVAL '1 hour';
END;
$$;