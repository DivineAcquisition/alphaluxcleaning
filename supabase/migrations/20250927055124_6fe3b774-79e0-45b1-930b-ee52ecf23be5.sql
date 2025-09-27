-- Update webhook configuration to use new Zapier URL
UPDATE webhook_configurations 
SET 
  url = 'https://hooks.zapier.com/hooks/catch/24603039/um6me4v/',
  name = 'Zapier Integration',
  event_types = ARRAY['booking_created', 'booking_confirmed', 'payment_processed', 'lead_created'],
  active = true,
  updated_at = now()
WHERE active = true;

-- If no active webhook exists, insert new one
INSERT INTO webhook_configurations (name, url, event_types, active)
SELECT 'Zapier Integration', 'https://hooks.zapier.com/hooks/catch/24603039/um6me4v/', 
       ARRAY['booking_created', 'booking_confirmed', 'payment_processed', 'lead_created'], true
WHERE NOT EXISTS (SELECT 1 FROM webhook_configurations WHERE active = true);