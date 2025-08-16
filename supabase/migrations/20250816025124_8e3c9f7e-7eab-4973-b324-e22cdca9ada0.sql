-- Fix security warnings by setting proper search paths for functions

-- Update log_payment_modifications function with secure search path
CREATE OR REPLACE FUNCTION public.log_payment_modifications()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
BEGIN
  -- Log modifications to payment data
  IF TG_OP = 'UPDATE' THEN
    PERFORM public.log_security_event(
      auth.uid(),
      'payment_data_modified',
      'subcontractor_payments',
      NEW.id::text,
      to_jsonb(OLD),
      to_jsonb(NEW),
      NULL,
      NULL,
      'high'
    );
    RETURN NEW;
  END IF;
  
  -- Log new payment creation
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_security_event(
      auth.uid(),
      'payment_data_created',
      'subcontractor_payments',
      NEW.id::text,
      NULL,
      to_jsonb(NEW),
      NULL,
      NULL,
      'high' 
    );
    RETURN NEW;
  END IF;
  
  -- Log payment deletion
  IF TG_OP = 'DELETE' THEN
    PERFORM public.log_security_event(
      auth.uid(),
      'payment_data_deleted',
      'subcontractor_payments',
      OLD.id::text,
      to_jsonb(OLD),
      NULL,
      NULL,
      NULL,
      'critical'
    );
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Update admin_can_manage_payments function with secure search path
CREATE OR REPLACE FUNCTION public.admin_can_manage_payments()
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify admin access and log the attempt
  IF NOT public.has_role(auth.uid(), 'super_admin'::app_role) THEN
    PERFORM public.log_security_event(
      auth.uid(),
      'unauthorized_payment_admin_access',
      'subcontractor_payments',
      NULL,
      NULL,
      jsonb_build_object('attempted_at', now()),
      NULL,
      NULL,
      'critical'
    );
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;