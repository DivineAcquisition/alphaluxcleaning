-- Create webhook_configurations table
CREATE TABLE public.webhook_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  event_types TEXT[] NOT NULL DEFAULT '{}',
  headers JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.webhook_configurations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage webhook configurations" 
ON public.webhook_configurations 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

-- Create webhook_delivery_logs table for tracking deliveries
CREATE TABLE public.webhook_delivery_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_config_id UUID REFERENCES webhook_configurations(id),
  booking_id UUID REFERENCES bookings(id),
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  response_headers JSONB,
  delivered_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  attempts INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for delivery logs
ALTER TABLE public.webhook_delivery_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for delivery logs
CREATE POLICY "Admins can view webhook delivery logs" 
ON public.webhook_delivery_logs 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

-- Insert your webhook configuration
INSERT INTO public.webhook_configurations (name, url, event_types, active) 
VALUES (
  'Main Webhook Endpoint',
  'https://hook.us1.make.com/4ylnu7rxi3vccttlwo8g1b2jycsd0w6e',
  ARRAY['BOOKING_CONFIRMED', 'BOOKING_CREATED'],
  true
);

-- Create trigger function for booking integrations
CREATE OR REPLACE FUNCTION public.trigger_booking_integrations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only trigger on INSERT with confirmed status or UPDATE to confirmed status
  IF (TG_OP = 'INSERT' AND NEW.status = 'confirmed') OR 
     (TG_OP = 'UPDATE' AND OLD.status != 'confirmed' AND NEW.status = 'confirmed') THEN
    
    -- Insert event record
    INSERT INTO events (type, booking_id, payload)
    VALUES ('BOOKING_CONFIRMED', NEW.id, jsonb_build_object(
      'customer_id', NEW.customer_id,
      'service_type', NEW.service_type,
      'frequency', NEW.frequency,
      'est_price', NEW.est_price,
      'source_channel', NEW.source_channel
    ));
    
    -- Call enhanced webhook function
    PERFORM net.http_post(
      url := 'https://yltvknkqnzdeiqckqjha.supabase.co/functions/v1/enhanced-booking-webhook-v2',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsdHZrbmtxbnpkZWlxY2txamhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2OTk5MjAsImV4cCI6MjA3MzI3NTkyMH0.t1q4kcz8iu2I0UNStsU3Be4_vuqZ0LFQksdmwTpxIZ8"}'::jsonb,
      body := jsonb_build_object('booking_id', NEW.id, 'action', 'booking_confirmed')
    );

    -- Call HCP sync function
    PERFORM net.http_post(
      url := 'https://yltvknkqnzdeiqckqjha.supabase.co/functions/v1/trigger-hcp-sync',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsdHZrbmtxbnpkZWlxY2txamhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2OTk5MjAsImV4cCI6MjA3MzI3NTkyMH0.t1q4kcz8iu2I0UNStsU3Be4_vuqZ0LFQksdmwTpxIZ8"}'::jsonb,
      body := jsonb_build_object('booking_id', NEW.id)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER trigger_booking_integrations_on_confirmation
  AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_booking_integrations();

-- Create updated_at trigger for webhook configs
CREATE TRIGGER update_webhook_configurations_updated_at
  BEFORE UPDATE ON public.webhook_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();