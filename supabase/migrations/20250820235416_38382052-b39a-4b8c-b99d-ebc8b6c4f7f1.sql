-- Patch: Make orders webhook trigger schema-agnostic to fix insert errors
-- Reason: Avoid referencing non-existent columns like subcontractor_assigned/order_status
-- This replaces the existing function to only emit on INSERT/UPDATE without field comparisons

CREATE OR REPLACE FUNCTION public.trigger_enhanced_webhook_on_order_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Fire on insert and any update without referencing specific columns
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.webhook_queue (webhook_url, payload, retry_count, created_at, event_type)
    VALUES (
      'enhanced-booking-webhook-v2',
      jsonb_build_object(
        'order_id', NEW.id,
        'trigger_event', 'order_created',
        'timestamp', now()
      ),
      0,
      now(),
      'order_webhook'
    );
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.webhook_queue (webhook_url, payload, retry_count, created_at, event_type)
    VALUES (
      'enhanced-booking-webhook-v2',
      jsonb_build_object(
        'order_id', NEW.id,
        'trigger_event', 'order_updated',
        'timestamp', now()
      ),
      0,
      now(),
      'order_webhook'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger is present and bound to the updated function
DROP TRIGGER IF EXISTS enhanced_webhook_trigger ON public.orders;
CREATE TRIGGER enhanced_webhook_trigger
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_enhanced_webhook_on_order_update();