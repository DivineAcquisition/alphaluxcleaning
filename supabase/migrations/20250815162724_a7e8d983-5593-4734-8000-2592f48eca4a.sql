-- Fix security issues: Set search_path for functions

-- Fix update_account_status_restrictions function
CREATE OR REPLACE FUNCTION public.update_account_status_restrictions()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If account is suspended, create/update restriction
  IF NEW.account_status = 'suspended' AND (OLD.account_status IS NULL OR OLD.account_status != 'suspended') THEN
    INSERT INTO public.subcontractor_restrictions (
      subcontractor_id,
      reason,
      restriction_type,
      is_active
    ) VALUES (
      NEW.id,
      'Account suspended - automated restriction',
      'job_acceptance',
      true
    )
    ON CONFLICT (subcontractor_id) 
    DO UPDATE SET 
      is_active = true,
      updated_at = now();
  END IF;
  
  -- If account is reactivated, deactivate restrictions
  IF NEW.account_status = 'active' AND OLD.account_status IN ('suspended', 'banned') THEN
    UPDATE public.subcontractor_restrictions
    SET is_active = false, updated_at = now()
    WHERE subcontractor_id = NEW.id AND is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$;