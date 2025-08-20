-- Update webhook configuration to use the correct Zapier URL
UPDATE public.webhook_configurations 
SET webhook_url = 'https://hooks.zapier.com/hooks/catch/5011258/u4jui7k/',
    is_active = true,
    events = ARRAY['booking_created', 'booking_updated', 'payment_confirmed', 'service_selection', 'service_details', 'confirmation']::text[],
    updated_at = now()
WHERE webhook_url LIKE '%webhook.site%' OR webhook_url LIKE '%zapier%';

-- Insert configuration if it doesn't exist
INSERT INTO public.webhook_configurations (
    webhook_url,
    is_active,
    events,
    description
) 
SELECT 
    'https://hooks.zapier.com/hooks/catch/5011258/u4jui7k/',
    true,
    ARRAY['booking_created', 'booking_updated', 'payment_confirmed', 'service_selection', 'service_details', 'confirmation']::text[],
    'Live Zapier webhook for booking data'
WHERE NOT EXISTS (
    SELECT 1 FROM public.webhook_configurations 
    WHERE webhook_url = 'https://hooks.zapier.com/hooks/catch/5011258/u4jui7k/'
);