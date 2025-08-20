-- Create database trigger to automatically send enhanced webhooks on order updates
CREATE OR REPLACE FUNCTION public.trigger_enhanced_webhook_on_order_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger webhook for significant updates
  IF (TG_OP = 'INSERT') OR 
     (TG_OP = 'UPDATE' AND (
       OLD.payment_status != NEW.payment_status OR 
       OLD.scheduled_date != NEW.scheduled_date OR
       OLD.subcontractor_assigned != NEW.subcontractor_assigned OR
       OLD.order_status != NEW.order_status
     )) THEN
    
    -- Queue the webhook call to run asynchronously
    INSERT INTO public.webhook_queue (
      webhook_url,
      payload,
      retry_count,
      created_at,
      event_type
    )
    SELECT 
      'enhanced-booking-webhook-v2' as webhook_url,
      jsonb_build_object(
        'order_id', NEW.id,
        'trigger_event', CASE 
          WHEN TG_OP = 'INSERT' THEN 'order_created'
          WHEN OLD.payment_status != NEW.payment_status THEN 'payment_updated'
          WHEN OLD.scheduled_date != NEW.scheduled_date THEN 'schedule_updated'
          WHEN OLD.subcontractor_assigned != NEW.subcontractor_assigned THEN 'subcontractor_assigned'
          WHEN OLD.order_status != NEW.order_status THEN 'status_updated'
          ELSE 'order_updated'
        END,
        'timestamp', now()
      ) as payload,
      0 as retry_count,
      now() as created_at,
      'order_webhook' as event_type;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on orders table
DROP TRIGGER IF EXISTS enhanced_webhook_trigger ON public.orders;
CREATE TRIGGER enhanced_webhook_trigger
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_enhanced_webhook_on_order_update();

-- Create a simple webhook queue table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.webhook_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_url TEXT NOT NULL,
  payload JSONB NOT NULL,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  event_type TEXT,
  status TEXT DEFAULT 'pending'
);

-- Enable RLS on webhook_queue
ALTER TABLE public.webhook_queue ENABLE ROW LEVEL SECURITY;

-- Allow system to manage webhook queue
CREATE POLICY "System manages webhook queue" ON public.webhook_queue
  FOR ALL USING (true);

-- Create index for processing
CREATE INDEX IF NOT EXISTS idx_webhook_queue_processing 
ON public.webhook_queue (status, created_at) 
WHERE status = 'pending';