-- Create function to send subcontractor updates to webhook
CREATE OR REPLACE FUNCTION public.send_subcontractor_update_webhook(
  p_update_type text,
  p_subcontractor_id uuid DEFAULT NULL,
  p_assignment_id uuid DEFAULT NULL,
  p_order_id uuid DEFAULT NULL,
  p_location jsonb DEFAULT NULL,
  p_message text DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_estimated_arrival_minutes integer DEFAULT NULL,
  p_photos jsonb DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Call the edge function to send webhook
  PERFORM
    net.http_post(
      url := 'https://kqoezqzogleaaupjzxch.supabase.co/functions/v1/send-subcontractor-updates',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.service_role_key', true) || '"}'::jsonb,
      body := jsonb_build_object(
        'update_type', p_update_type,
        'subcontractor_id', p_subcontractor_id,
        'assignment_id', p_assignment_id,
        'order_id', p_order_id,
        'location', p_location,
        'message', p_message,
        'status', p_status,
        'estimated_arrival_minutes', p_estimated_arrival_minutes,
        'photos', p_photos,
        'notes', p_notes
      )
    );
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the main operation
  NULL;
END;
$$;

-- Trigger function for job tracking updates (check-in/check-out)
CREATE OR REPLACE FUNCTION public.trigger_job_tracking_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Determine update type based on what changed
  IF OLD.check_in_time IS NULL AND NEW.check_in_time IS NOT NULL THEN
    -- Check-in event
    PERFORM public.send_subcontractor_update_webhook(
      'check_in',
      NEW.subcontractor_id,
      NEW.assignment_id,
      NEW.order_id,
      CASE WHEN NEW.check_in_location IS NOT NULL THEN
        jsonb_build_object('address', NEW.check_in_location)
      END,
      'Subcontractor checked in',
      NULL,
      NULL,
      NEW.photos,
      NEW.notes
    );
  ELSIF OLD.check_out_time IS NULL AND NEW.check_out_time IS NOT NULL THEN
    -- Check-out event
    PERFORM public.send_subcontractor_update_webhook(
      'check_out',
      NEW.subcontractor_id,
      NEW.assignment_id,
      NEW.order_id,
      CASE WHEN NEW.check_out_location IS NOT NULL THEN
        jsonb_build_object('address', NEW.check_out_location)
      END,
      'Subcontractor checked out',
      NULL,
      NULL,
      NEW.photos,
      NEW.notes
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger function for order status updates
CREATE OR REPLACE FUNCTION public.trigger_status_update_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Send status message update
  PERFORM public.send_subcontractor_update_webhook(
    'status_message',
    NEW.subcontractor_id,
    NULL,
    NEW.order_id,
    NULL,
    NEW.status_message,
    NULL,
    NEW.estimated_arrival_minutes,
    NULL,
    NULL
  );
  
  RETURN NEW;
END;
$$;

-- Trigger function for assignment changes
CREATE OR REPLACE FUNCTION public.trigger_assignment_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only trigger on status changes
  IF OLD.status != NEW.status THEN
    PERFORM public.send_subcontractor_update_webhook(
      'assignment_change',
      NEW.subcontractor_id,
      NEW.id,
      NEW.booking_id,
      NULL,
      'Assignment status changed to: ' || NEW.status,
      NEW.status,
      NULL,
      NULL,
      NEW.subcontractor_notes
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS job_tracking_webhook_trigger ON public.job_tracking;
CREATE TRIGGER job_tracking_webhook_trigger
  AFTER UPDATE ON public.job_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_job_tracking_webhook();

DROP TRIGGER IF EXISTS status_update_webhook_trigger ON public.order_status_updates;
CREATE TRIGGER status_update_webhook_trigger
  AFTER INSERT ON public.order_status_updates
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_status_update_webhook();

DROP TRIGGER IF EXISTS assignment_webhook_trigger ON public.subcontractor_job_assignments;
CREATE TRIGGER assignment_webhook_trigger
  AFTER UPDATE ON public.subcontractor_job_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_assignment_webhook();