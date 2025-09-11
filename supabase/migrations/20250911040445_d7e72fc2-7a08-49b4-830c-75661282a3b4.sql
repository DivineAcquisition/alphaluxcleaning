-- Insert default email templates for Bay Area Cleaning Pros
INSERT INTO public.email_templates (
  company_id,
  template_key,
  subject,
  react_component_key
) VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'booking_confirmation', 'Booking Confirmed - {{service_date}}', 'BookingConfirmationEmail'),
  ('550e8400-e29b-41d4-a716-446655440000', 'booking_reminder_24h', 'Service Reminder - Tomorrow {{service_date}}', 'BookingReminderEmail'),
  ('550e8400-e29b-41d4-a716-446655440000', 'booking_reminder_1h', 'Service Starting Soon - {{service_time}}', 'BookingReminderEmail'),
  ('550e8400-e29b-41d4-a716-446655440000', 'receipt', 'Payment Receipt - ${{amount}}', 'ReceiptEmail'),
  ('550e8400-e29b-41d4-a716-446655440000', 'portal_magic_link', 'Access Your Customer Portal', 'MagicLinkEmail'),
  ('550e8400-e29b-41d4-a716-446655440000', 'otp', 'Your Verification Code', 'OTPEmail'),
  ('550e8400-e29b-41d4-a716-446655440000', 'sub_offer', 'New Job Offer - {{service_date}}', 'SubcontractorOfferEmail'),
  ('550e8400-e29b-41d4-a716-446655440000', 'sub_reminder', 'Job Reminder - {{service_time}}', 'SubcontractorReminderEmail')
ON CONFLICT (company_id, template_key) DO UPDATE SET
  subject = EXCLUDED.subject,
  react_component_key = EXCLUDED.react_component_key,
  updated_at = now();