-- Insert default notification templates and automated triggers

-- Insert notification templates
INSERT INTO notification_templates (name, template_type, subject_template, body_template, trigger_events, variables) VALUES
('Order Confirmed SMS', 'sms', NULL, 'Hi {{customer_name}}! Your cleaning service order #{{order_id}} has been confirmed for {{service_date}}. Amount: ${{amount}}. We''ll send updates as we assign your cleaner. Questions? Reply HELP', ARRAY['order_created'], '{"customer_name": "string", "order_id": "string", "service_date": "date", "amount": "number"}'),

('Payment Successful SMS', 'sms', NULL, 'Payment confirmed! Your cleaning service for {{service_date}} is all set. We''ll notify you when your cleaner is assigned and on their way. Bay Area Cleaning - {{customer_name}}', ARRAY['order_status_changed'], '{"customer_name": "string", "service_date": "date"}'),

('Cleaner Assigned SMS', 'sms', NULL, 'Great news {{customer_name}}! {{cleaner_name}} has been assigned to your cleaning on {{service_date}} at {{service_time}}. They''ll text you when they''re on the way!', ARRAY['booking_status_changed'], '{"customer_name": "string", "cleaner_name": "string", "service_date": "date", "service_time": "string"}'),

('Service Started SMS', 'sms', NULL, 'Your cleaner {{cleaner_name}} has arrived and started your cleaning service. Estimated completion: {{estimated_completion}}. Enjoy your day! - Bay Area Cleaning', ARRAY['booking_status_changed'], '{"cleaner_name": "string", "estimated_completion": "string"}'),

('Service Completed SMS', 'sms', NULL, 'Your cleaning is complete! How did we do? Rate your experience: {{feedback_link}}. Thank you for choosing Bay Area Cleaning, {{customer_name}}!', ARRAY['booking_status_changed'], '{"customer_name": "string", "feedback_link": "string"}'),

('Application Received SMS', 'sms', NULL, 'Hi {{applicant_name}}! We received your cleaning contractor application. We''ll review it within 24-48 hours and contact you with next steps. Thanks for your interest!', ARRAY['application_submitted'], '{"applicant_name": "string"}'),

('Application Approved SMS', 'sms', NULL, 'Congratulations {{applicant_name}}! Your application has been approved. Click here to complete your onboarding: {{onboarding_link}}. Welcome to the Bay Area Cleaning team!', ARRAY['application_status_changed'], '{"applicant_name": "string", "onboarding_link": "string"}'),

-- In-app notification templates
('Order Update In-App', 'in_app', 'Order Status Updated', 'Your order #{{order_id}} status has changed from {{old_status}} to {{new_status}}.', ARRAY['order_status_changed'], '{"order_id": "string", "old_status": "string", "new_status": "string"}'),

('New Job Assignment In-App', 'in_app', 'New Job Assigned', 'You have a new cleaning job assigned for {{service_date}} at {{service_time}} - {{customer_address}}.', ARRAY['booking_status_changed'], '{"service_date": "date", "service_time": "string", "customer_address": "string"}'),

('Admin Alert In-App', 'in_app', 'New Application Submitted', 'A new subcontractor application has been submitted by {{applicant_name}} ({{applicant_email}}).', ARRAY['application_submitted'], '{"applicant_name": "string", "applicant_email": "string"}')',

-- Email templates  
('Order Confirmation Email', 'email', 'Your Bay Area Cleaning Service is Confirmed!', 'Dear {{customer_name}},\n\nThank you for choosing Bay Area Cleaning! Your service has been confirmed:\n\nOrder #: {{order_id}}\nService Date: {{service_date}}\nAmount: ${{amount}}\n\nWe will assign a cleaner to your job and notify you 24 hours before your service.\n\nBest regards,\nBay Area Cleaning Team', ARRAY['order_created'], '{"customer_name": "string", "order_id": "string", "service_date": "date", "amount": "number"}')

ON CONFLICT (name) DO NOTHING;

-- Insert automated notification triggers
INSERT INTO automated_notification_triggers (name, description, trigger_event, template_id, delivery_methods, delay_minutes, priority) 
SELECT 
  'Order Confirmation SMS',
  'Send SMS confirmation when new order is created',
  'order_created',
  (SELECT id FROM notification_templates WHERE name = 'Order Confirmed SMS'),
  ARRAY['sms'],
  0,
  1
WHERE NOT EXISTS (SELECT 1 FROM automated_notification_triggers WHERE name = 'Order Confirmation SMS');

INSERT INTO automated_notification_triggers (name, description, trigger_event, template_id, delivery_methods, delay_minutes, priority, trigger_conditions) 
SELECT 
  'Payment Success SMS',
  'Send SMS when order status changes to paid',
  'order_status_changed',
  (SELECT id FROM notification_templates WHERE name = 'Payment Successful SMS'),
  ARRAY['sms'],
  0,
  1,
  '{"new_status": "paid"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM automated_notification_triggers WHERE name = 'Payment Success SMS');

INSERT INTO automated_notification_triggers (name, description, trigger_event, template_id, delivery_methods, delay_minutes, priority, trigger_conditions) 
SELECT 
  'Service Started SMS',
  'Send SMS when booking status changes to in_progress',
  'booking_status_changed',
  (SELECT id FROM notification_templates WHERE name = 'Service Started SMS'),
  ARRAY['sms'],
  0,
  1,
  '{"new_status": "in_progress"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM automated_notification_triggers WHERE name = 'Service Started SMS');

INSERT INTO automated_notification_triggers (name, description, trigger_event, template_id, delivery_methods, delay_minutes, priority, trigger_conditions) 
SELECT 
  'Service Completed SMS',
  'Send SMS when booking status changes to completed',
  'booking_status_changed',
  (SELECT id FROM notification_templates WHERE name = 'Service Completed SMS'),
  ARRAY['sms'],
  0,
  1,
  '{"new_status": "completed"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM automated_notification_triggers WHERE name = 'Service Completed SMS');

INSERT INTO automated_notification_triggers (name, description, trigger_event, template_id, delivery_methods, delay_minutes, priority) 
SELECT 
  'Application Received SMS',
  'Send SMS confirmation when new application is submitted',
  'application_submitted',
  (SELECT id FROM notification_templates WHERE name = 'Application Received SMS'),
  ARRAY['sms'],
  0,
  2
WHERE NOT EXISTS (SELECT 1 FROM automated_notification_triggers WHERE name = 'Application Received SMS');

INSERT INTO automated_notification_triggers (name, description, trigger_event, template_id, delivery_methods, delay_minutes, priority, trigger_conditions) 
SELECT 
  'Application Approved SMS',
  'Send SMS when application is approved',
  'application_status_changed',
  (SELECT id FROM notification_templates WHERE name = 'Application Approved SMS'),
  ARRAY['sms'],
  0,
  1,
  '{"new_status": "approved"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM automated_notification_triggers WHERE name = 'Application Approved SMS');

-- In-app notification triggers
INSERT INTO automated_notification_triggers (name, description, trigger_event, template_id, delivery_methods, delay_minutes, priority) 
SELECT 
  'Order Status In-App Notification',
  'Send in-app notification for order status changes',
  'order_status_changed',
  (SELECT id FROM notification_templates WHERE name = 'Order Update In-App'),
  ARRAY['in_app'],
  0,
  3
WHERE NOT EXISTS (SELECT 1 FROM automated_notification_triggers WHERE name = 'Order Status In-App Notification');

INSERT INTO automated_notification_triggers (name, description, trigger_event, template_id, delivery_methods, delay_minutes, priority) 
SELECT 
  'Admin Application Alert',
  'Send in-app notification to admins for new applications',
  'application_submitted',
  (SELECT id FROM notification_templates WHERE name = 'Admin Alert In-App'),
  ARRAY['admin'],
  0,
  2
WHERE NOT EXISTS (SELECT 1 FROM automated_notification_triggers WHERE name = 'Admin Application Alert');