INSERT INTO webhook_configurations (name, url, active, event_types)
VALUES (
  'GHL Booking Webhook',
  'https://services.leadconnectorhq.com/hooks/Lvvq87zxxbYFnaTEklYX/webhook-trigger/8ca99da6-75d7-44dc-b3c7-9a9fe842d871',
  true,
  ARRAY['booking_created', 'booking_confirmed', 'payment_processed']
);