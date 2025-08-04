-- Fix function search path issue
CREATE OR REPLACE FUNCTION public.notify_service_request_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Insert notification for status changes
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    INSERT INTO public.order_status_updates (
      order_id,
      status_message,
      created_at
    ) VALUES (
      NEW.order_id,
      'Service request ' || NEW.request_type || ' has been ' || NEW.status,
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$;