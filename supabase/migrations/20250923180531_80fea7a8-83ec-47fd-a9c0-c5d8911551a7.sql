-- Fix the function to have proper search_path
CREATE OR REPLACE FUNCTION public.cleanup_expired_admin_otp_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM public.admin_otp_codes 
  WHERE expires_at < now() - INTERVAL '1 hour';
END;
$$;