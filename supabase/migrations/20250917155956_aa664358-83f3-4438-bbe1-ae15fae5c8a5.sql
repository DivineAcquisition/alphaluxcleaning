-- Create webhook idempotency tracking table
CREATE TABLE public.webhook_idempotency (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  idempotency_key TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.webhook_idempotency ENABLE ROW LEVEL SECURITY;

-- Create policy for service role access (webhooks run with service role)
CREATE POLICY "Service role can manage webhook idempotency" 
ON public.webhook_idempotency 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create index for fast lookups
CREATE INDEX idx_webhook_idempotency_key ON public.webhook_idempotency(idempotency_key);
CREATE INDEX idx_webhook_idempotency_type ON public.webhook_idempotency(event_type);

-- Create trigger for updated_at
CREATE TRIGGER update_webhook_idempotency_updated_at
BEFORE UPDATE ON public.webhook_idempotency
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();