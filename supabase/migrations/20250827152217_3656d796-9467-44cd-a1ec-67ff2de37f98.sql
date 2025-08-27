-- Add the new GHL webhook URL to webhook configurations
INSERT INTO public.webhook_configurations (
  name,
  webhook_url,
  webhook_type,
  is_active,
  description,
  headers_config,
  retry_config
) VALUES (
  'GHL Inbound Webhook - Updated',
  'https://services.leadconnectorhq.com/hooks/jWh1TtlCjUDeZZ27RkkI/webhook-trigger/94998e4d-5fcc-45ea-a91f-2585e8f88600',
  'inbound',
  true,
  'Updated GoHighLevel inbound webhook for payment and order processing',
  '{"Content-Type": "application/json"}',
  '{"max_attempts": 3, "backoff_multiplier": 2, "base_delay_ms": 1000}'
) ON CONFLICT (webhook_url) DO UPDATE SET
  name = EXCLUDED.name,
  is_active = EXCLUDED.is_active,
  description = EXCLUDED.description,
  updated_at = now();