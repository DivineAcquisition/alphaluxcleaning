-- Create email infrastructure tables for Bay Area Cleaning Pros

-- Email settings per company
CREATE TABLE public.email_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL UNIQUE,
  from_name TEXT DEFAULT 'Bay Area Cleaning Pros',
  from_email TEXT DEFAULT 'notifications@bayareacleaningpros.com',
  reply_to TEXT,
  brand JSONB DEFAULT '{"logo_url": "", "color_hex": "#A58FFF"}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for email_settings
CREATE POLICY "Company admins can manage email settings"
ON public.email_settings
FOR ALL
USING (company_id IN (
  SELECT company_id FROM public.user_roles
  WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
));

-- Email templates (default + per-company overrides)
CREATE TABLE public.email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  template_key TEXT NOT NULL,
  subject TEXT NOT NULL,
  react_component_key TEXT NOT NULL,
  overrides JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(company_id, template_key)
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for email_templates
CREATE POLICY "Company admins can manage email templates"
ON public.email_templates
FOR ALL
USING (company_id IN (
  SELECT company_id FROM public.user_roles
  WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
));

-- Email events (tracking sent emails)
CREATE TABLE public.email_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  template_key TEXT NOT NULL,
  to_email TEXT NOT NULL,
  message_id TEXT,
  status TEXT DEFAULT 'queued',
  payload JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

-- Create policies for email_events
CREATE POLICY "Company admins can view email events"
ON public.email_events
FOR SELECT
USING (company_id IN (
  SELECT company_id FROM public.user_roles
  WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
));

-- System can insert email events
CREATE POLICY "System can insert email events"
ON public.email_events
FOR INSERT
WITH CHECK (true);

-- Email webhook receipts (from Resend)
CREATE TABLE public.email_webhook_receipts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID,
  provider_event TEXT NOT NULL,
  message_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_webhook_receipts ENABLE ROW LEVEL SECURITY;

-- Create policies for email_webhook_receipts
CREATE POLICY "Company admins can view webhook receipts"
ON public.email_webhook_receipts
FOR SELECT
USING (company_id IN (
  SELECT company_id FROM public.user_roles
  WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
));

-- System can insert webhook receipts
CREATE POLICY "System can insert webhook receipts"
ON public.email_webhook_receipts
FOR INSERT
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_email_events_company_created ON public.email_events(company_id, created_at DESC);
CREATE INDEX idx_email_events_message_id ON public.email_events(message_id);
CREATE INDEX idx_email_templates_company_key ON public.email_templates(company_id, template_key);
CREATE INDEX idx_email_webhook_receipts_message_id ON public.email_webhook_receipts(message_id);

-- Insert default email templates
INSERT INTO public.email_templates (company_id, template_key, subject, react_component_key) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'booking_confirmation', 'Booking Confirmed - {{customer_name}}', 'BookingConfirmationEmail'),
('550e8400-e29b-41d4-a716-446655440000', 'booking_reminder_24h', 'Reminder: Service Tomorrow - {{customer_name}}', 'BookingReminderEmail'),
('550e8400-e29b-41d4-a716-446655440000', 'booking_reminder_1h', 'Service Starting Soon - {{customer_name}}', 'BookingReminderEmail'),
('550e8400-e29b-41d4-a716-446655440000', 'receipt', 'Payment Receipt - {{customer_name}}', 'ReceiptEmail'),
('550e8400-e29b-41d4-a716-446655440000', 'portal_magic_link', 'Access Your Account - Bay Area Cleaning Pros', 'CustomerPortalMagicLinkEmail'),
('550e8400-e29b-41d4-a716-446655440000', 'otp', 'Your Verification Code - {{code}}', 'OtpEmail'),
('550e8400-e29b-41d4-a716-446655440000', 'sub_offer', 'New Job Offer - {{service_date}}', 'SubNewOfferEmail'),
('550e8400-e29b-41d4-a716-446655440000', 'sub_reminder', 'Job Reminder - {{service_date}}', 'SubReminderEmail'),
('550e8400-e29b-41d4-a716-446655440000', 'timeoff_update', 'Time Off Request Update', 'TimeoffUpdateEmail'),
('550e8400-e29b-41d4-a716-446655440000', 'stripe_capture_needed', 'Payment Capture Required', 'StripeCaptureNeededEmail'),
('550e8400-e29b-41d4-a716-446655440000', 'stripe_connect_issue', 'Stripe Connect Issue', 'StripeConnectIssueEmail'),
('550e8400-e29b-41d4-a716-446655440000', 'low_availability_alert', 'Low Availability Alert', 'LowAvailabilityAlertEmail');

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_email_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_email_settings_updated_at
  BEFORE UPDATE ON public.email_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_email_settings_updated_at();

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_email_settings_updated_at();