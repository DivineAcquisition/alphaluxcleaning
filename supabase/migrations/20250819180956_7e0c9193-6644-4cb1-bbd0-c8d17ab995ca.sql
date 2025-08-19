-- Insert default notification templates and automated triggers (Fixed)

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

('Admin Alert In-App', 'in_app', 'New Application Submitted', 'A new subcontractor application has been submitted by {{applicant_name}} ({{applicant_email}}).', ARRAY['application_submitted'], '{"applicant_name": "string", "applicant_email": "string"}'),

-- Email templates  
('Order Confirmation Email', 'email', 'Your Bay Area Cleaning Service is Confirmed!', 'Dear {{customer_name}},\n\nThank you for choosing Bay Area Cleaning! Your service has been confirmed:\n\nOrder #: {{order_id}}\nService Date: {{service_date}}\nAmount: ${{amount}}\n\nWe will assign a cleaner to your job and notify you 24 hours before your service.\n\nBest regards,\nBay Area Cleaning Team', ARRAY['order_created'], '{"customer_name": "string", "order_id": "string", "service_date": "date", "amount": "number"}')

ON CONFLICT (name) DO NOTHING;