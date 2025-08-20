-- Create webhook configuration table
CREATE TABLE public.webhook_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_name TEXT NOT NULL DEFAULT 'Bay Area Cleaning Pros',
  webhook_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  webhook_events TEXT[] NOT NULL DEFAULT ARRAY['booking_created', 'booking_updated', 'payment_confirmed'],
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.webhook_configurations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage webhook configurations" 
ON public.webhook_configurations 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Create webhook delivery logs table
CREATE TABLE public.webhook_delivery_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_config_id UUID REFERENCES public.webhook_configurations(id),
  webhook_url TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  delivery_attempt INTEGER NOT NULL DEFAULT 1,
  is_success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.webhook_delivery_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can view webhook delivery logs" 
ON public.webhook_delivery_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "System can insert webhook delivery logs" 
ON public.webhook_delivery_logs 
FOR INSERT 
WITH CHECK (true);

-- Insert default webhook configuration
INSERT INTO public.webhook_configurations (organization_name, webhook_url, webhook_events)
VALUES ('Bay Area Cleaning Pros', 'https://webhook.site/unique-id', ARRAY['booking_created', 'booking_updated', 'payment_confirmed']);