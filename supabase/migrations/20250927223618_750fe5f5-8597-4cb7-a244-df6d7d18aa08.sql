-- Security fix: set search_path for update_referral_config_updated_at
CREATE OR REPLACE FUNCTION public.update_referral_config_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;