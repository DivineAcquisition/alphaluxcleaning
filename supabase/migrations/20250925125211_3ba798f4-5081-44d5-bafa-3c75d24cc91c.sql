-- Fix the trigger_booking_integrations function to remove invalid state field reference
CREATE OR REPLACE FUNCTION public.trigger_booking_integrations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  -- Only trigger on INSERT with confirmed status or UPDATE to confirmed status
  IF (TG_OP = 'INSERT' AND NEW.status = 'confirmed') OR 
     (TG_OP = 'UPDATE' AND OLD.status != 'confirmed' AND NEW.status = 'confirmed') THEN
    
    -- Insert event record (removed invalid 'state' field reference)
    INSERT INTO events (type, booking_id, payload)
    VALUES ('BOOKING_CONFIRMED', NEW.id, jsonb_build_object(
      'customer_id', NEW.customer_id,
      'service_type', NEW.service_type,
      'frequency', NEW.frequency,
      'est_price', NEW.est_price,
      'source_channel', NEW.source_channel
    ));
    
    -- Call the existing Zapier sync function
    PERFORM net.http_post(
      url := 'https://yltvknkqnzdeiqckqjha.supabase.co/functions/v1/sync-booking-integrations',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsdHZrbmtxbnpkZWlxY2txamhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2OTk5MjAsImV4cCI6MjA3MzI3NTkyMH0.t1q4kcz8iu2I0UNStsU3Be4_vuqZ0LFQksdmwTpxIZ8"}'::jsonb,
      body := jsonb_build_object('booking_id', NEW.id, 'action', 'booking_confirmed')
    );

    -- Call the new HCP sync function
    PERFORM net.http_post(
      url := 'https://yltvknkqnzdeiqckqjha.supabase.co/functions/v1/trigger-hcp-sync',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsdHZrbmtxbnpkZWlxY2txamhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2OTk5MjAsImV4cCI6MjA3MzI3NTkyMH0.t1q4kcz8iu2I0UNStsU3Be4_vuqZ0LFQksdmwTpxIZ8"}'::jsonb,
      body := jsonb_build_object('booking_id', NEW.id)
    );
  END IF;
  
  RETURN NEW;
END;
$function$;