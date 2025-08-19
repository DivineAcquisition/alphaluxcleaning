-- Insert default SMS notification templates for automated triggers

-- First ensure we have the right columns
ALTER TABLE notification_templates ADD COLUMN IF NOT EXISTS template_type TEXT;
ALTER TABLE notification_templates ADD COLUMN IF NOT EXISTS body_template TEXT;
ALTER TABLE notification_templates ADD COLUMN IF NOT EXISTS subject_template TEXT;
ALTER TABLE notification_templates ADD COLUMN IF NOT EXISTS trigger_events TEXT[];
ALTER TABLE notification_templates ADD COLUMN IF NOT EXISTS variables JSONB DEFAULT '{}';

-- Clear any existing test data and insert fresh templates
DELETE FROM notification_templates WHERE name LIKE '%SMS' OR name LIKE '%In-App' OR name LIKE '%Email';

-- Insert the SMS templates
INSERT INTO notification_templates (name, template_type, body_template, trigger_events, variables) VALUES
('Order Confirmed SMS', 'sms', 'Hi {{customer_name}}! Your cleaning service order #{{order_id}} has been confirmed for {{service_date}}. Amount: ${{amount}}. We''ll send updates as we assign your cleaner. Questions? Reply HELP', ARRAY['order_created'], '{"customer_name": "string", "order_id": "string", "service_date": "date", "amount": "number"}'),

('Payment Successful SMS', 'sms', 'Payment confirmed! Your cleaning service for {{service_date}} is all set. We''ll notify you when your cleaner is assigned and on their way. Bay Area Cleaning - {{customer_name}}', ARRAY['order_status_changed'], '{"customer_name": "string", "service_date": "date"}'),

('Service Started SMS', 'sms', 'Your cleaner {{cleaner_name}} has arrived and started your cleaning service. Estimated completion: {{estimated_completion}}. Enjoy your day! - Bay Area Cleaning', ARRAY['booking_status_changed'], '{"cleaner_name": "string", "estimated_completion": "string"}'),

('Service Completed SMS', 'sms', 'Your cleaning is complete! How did we do? Rate your experience: {{feedback_link}}. Thank you for choosing Bay Area Cleaning, {{customer_name}}!', ARRAY['booking_status_changed'], '{"customer_name": "string", "feedback_link": "string"}'),

('Application Received SMS', 'sms', 'Hi {{applicant_name}}! We received your cleaning contractor application. We''ll review it within 24-48 hours and contact you with next steps. Thanks for your interest!', ARRAY['application_submitted'], '{"applicant_name": "string"}'),

('Application Approved SMS', 'sms', 'Congratulations {{applicant_name}}! Your application has been approved. Click here to complete your onboarding: {{onboarding_link}}. Welcome to the Bay Area Cleaning team!', ARRAY['application_status_changed'], '{"applicant_name": "string", "onboarding_link": "string"}');

-- Insert automated notification triggers
INSERT INTO automated_notification_triggers (name, description, trigger_event, template_id, delivery_methods, delay_minutes, priority) VALUES
('Order Confirmation SMS', 'Send SMS confirmation when new order is created', 'order_created', (SELECT id FROM notification_templates WHERE name = 'Order Confirmed SMS'), ARRAY['sms'], 0, 1),

('Payment Success SMS', 'Send SMS when order status changes to paid', 'order_status_changed', (SELECT id FROM notification_templates WHERE name = 'Payment Successful SMS'), ARRAY['sms'], 0, 1),

('Service Started SMS', 'Send SMS when booking status changes to in_progress', 'booking_status_changed', (SELECT id FROM notification_templates WHERE name = 'Service Started SMS'), ARRAY['sms'], 0, 1),

('Service Completed SMS', 'Send SMS when booking status changes to completed', 'booking_status_changed', (SELECT id FROM notification_templates WHERE name = 'Service Completed SMS'), ARRAY['sms'], 0, 1),

('Application Received SMS', 'Send SMS confirmation when new application is submitted', 'application_submitted', (SELECT id FROM notification_templates WHERE name = 'Application Received SMS'), ARRAY['sms'], 0, 2),

('Application Approved SMS', 'Send SMS when application is approved', 'application_status_changed', (SELECT id FROM notification_templates WHERE name = 'Application Approved SMS'), ARRAY['sms'], 0, 1);