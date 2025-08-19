-- Create webhook_logs table for tracking webhook deliveries
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_url TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  success BOOLEAN NOT NULL DEFAULT false,
  event_type TEXT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for webhook logs
CREATE POLICY "Admins can manage webhook logs" 
ON public.webhook_logs 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Create policy for service role (edge functions)
CREATE POLICY "Service role can insert webhook logs" 
ON public.webhook_logs 
FOR INSERT 
USING (true)
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX idx_webhook_logs_event_type ON public.webhook_logs(event_type);
CREATE INDEX idx_webhook_logs_created_at ON public.webhook_logs(created_at DESC);
CREATE INDEX idx_webhook_logs_webhook_url ON public.webhook_logs(webhook_url);