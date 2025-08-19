-- Check and fix notification_templates structure, then insert default data

-- First, let's see what we have and ensure we have the right structure
DO $$ 
DECLARE
    has_template_type BOOLEAN;
    has_body_template BOOLEAN;
BEGIN
    -- Check if the columns exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notification_templates' 
        AND column_name = 'template_type'
        AND table_schema = 'public'
    ) INTO has_template_type;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notification_templates' 
        AND column_name = 'body_template'
        AND table_schema = 'public'
    ) INTO has_body_template;
    
    -- Add missing columns if they don't exist
    IF NOT has_template_type THEN
        ALTER TABLE notification_templates ADD COLUMN template_type TEXT;
    END IF;
    
    IF NOT has_body_template THEN
        ALTER TABLE notification_templates ADD COLUMN body_template TEXT;
        ALTER TABLE notification_templates ADD COLUMN subject_template TEXT;
        ALTER TABLE notification_templates ADD COLUMN trigger_events TEXT[];
        ALTER TABLE notification_templates ADD COLUMN variables JSONB DEFAULT '{}';
    END IF;
END $$;

-- Now insert the templates with fallback structure
INSERT INTO notification_templates (name, template_type, subject_template, body_template, trigger_events, variables) VALUES
('Order Confirmed SMS', 'sms', NULL, 'Hi {{customer_name}}! Your cleaning service order #{{order_id}} has been confirmed for {{service_date}}. Amount: ${{amount}}. We''ll send updates as we assign your cleaner. Questions? Reply HELP', ARRAY['order_created'], '{"customer_name": "string", "order_id": "string", "service_date": "date", "amount": "number"}'),

('Payment Successful SMS', 'sms', NULL, 'Payment confirmed! Your cleaning service for {{service_date}} is all set. We''ll notify you when your cleaner is assigned and on their way. Bay Area Cleaning - {{customer_name}}', ARRAY['order_status_changed'], '{"customer_name": "string", "service_date": "date"}'),

('Service Started SMS', 'sms', NULL, 'Your cleaner {{cleaner_name}} has arrived and started your cleaning service. Estimated completion: {{estimated_completion}}. Enjoy your day! - Bay Area Cleaning', ARRAY['booking_status_changed'], '{"cleaner_name": "string", "estimated_completion": "string"}'),

('Service Completed SMS', 'sms', NULL, 'Your cleaning is complete! How did we do? Rate your experience: {{feedback_link}}. Thank you for choosing Bay Area Cleaning, {{customer_name}}!', ARRAY['booking_status_changed'], '{"customer_name": "string", "feedback_link": "string"}'),

('Application Received SMS', 'sms', NULL, 'Hi {{applicant_name}}! We received your cleaning contractor application. We''ll review it within 24-48 hours and contact you with next steps. Thanks for your interest!', ARRAY['application_submitted'], '{"applicant_name": "string"}'),

('Application Approved SMS', 'sms', NULL, 'Congratulations {{applicant_name}}! Your application has been approved. Click here to complete your onboarding: {{onboarding_link}}. Welcome to the Bay Area Cleaning team!', ARRAY['application_status_changed'], '{"applicant_name": "string", "onboarding_link": "string"}')

ON CONFLICT (name) DO NOTHING;