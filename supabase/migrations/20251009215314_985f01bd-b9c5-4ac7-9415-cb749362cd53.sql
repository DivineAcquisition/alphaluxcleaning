-- Part 1: Create webhook_queue table for asynchronous processing
CREATE TABLE IF NOT EXISTS public.webhook_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending',
  attempts int NOT NULL DEFAULT 0,
  max_attempts int NOT NULL DEFAULT 3,
  next_retry_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

CREATE INDEX idx_webhook_queue_status ON public.webhook_queue(status, next_retry_at);
CREATE INDEX idx_webhook_queue_booking ON public.webhook_queue(booking_id);

-- Enable RLS on webhook_queue
ALTER TABLE public.webhook_queue ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage webhook queue
CREATE POLICY "Admins can manage webhook queue"
ON public.webhook_queue
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Part 2: Create webhook_audit_log table for monitoring
CREATE TABLE IF NOT EXISTS public.webhook_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id),
  event_type text NOT NULL,
  trigger_source text NOT NULL,
  status text NOT NULL,
  error_message text,
  request_payload jsonb,
  response_payload jsonb,
  execution_time_ms int,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_webhook_audit_booking ON public.webhook_audit_log(booking_id);
CREATE INDEX idx_webhook_audit_status ON public.webhook_audit_log(status, created_at);

-- Enable RLS on webhook_audit_log
ALTER TABLE public.webhook_audit_log ENABLE ROW LEVEL SECURITY;

-- Allow admins to view audit logs
CREATE POLICY "Admins can view webhook audit logs"
ON public.webhook_audit_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Part 3: Replace trigger_booking_integrations to use queue instead of direct HTTP calls
CREATE OR REPLACE FUNCTION public.trigger_booking_integrations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only trigger on INSERT with confirmed status or UPDATE to confirmed status
  IF (TG_OP = 'INSERT' AND NEW.status = 'confirmed') OR 
     (TG_OP = 'UPDATE' AND OLD.status != 'confirmed' AND NEW.status = 'confirmed') THEN
    
    -- Insert event record (keep existing behavior)
    INSERT INTO public.events (type, booking_id, payload)
    VALUES ('BOOKING_CONFIRMED', NEW.id, jsonb_build_object(
      'customer_id', NEW.customer_id,
      'service_type', NEW.service_type,
      'frequency', NEW.frequency,
      'est_price', NEW.est_price,
      'source_channel', NEW.source_channel
    ));
    
    -- Queue webhook for asynchronous processing (NEW APPROACH - fixes race condition)
    INSERT INTO public.webhook_queue (booking_id, event_type, payload)
    VALUES (
      NEW.id,
      'booking_confirmed',
      jsonb_build_object(
        'booking_id', NEW.id,
        'action', 'booking_confirmed',
        'trigger_time', now()
      )
    );
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Part 4: Clean up duplicate triggers and create single trigger
DROP TRIGGER IF EXISTS booking_integrations_trigger ON public.bookings;
DROP TRIGGER IF EXISTS trigger_booking_integrations_on_confirmation ON public.bookings;
DROP TRIGGER IF EXISTS booking_integrations_on_confirm ON public.bookings;

-- Create the single trigger
CREATE TRIGGER booking_integrations_on_confirm
  AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_booking_integrations();