-- Phase 1: Core Infrastructure Tables for Enhanced Subcontractor Dispatch System

-- Job Assignment Tokens for secure accept/decline links
CREATE TABLE public.job_assignment_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id uuid NOT NULL REFERENCES public.subcontractor_job_assignments(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  action text NOT NULL CHECK (action IN ('accept', 'decline', 'view')),
  expires_at timestamp with time zone NOT NULL,
  used_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enhanced subcontractor responses tracking
CREATE TABLE public.subcontractor_responses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id uuid NOT NULL REFERENCES public.subcontractor_job_assignments(id) ON DELETE CASCADE,
  subcontractor_id uuid NOT NULL REFERENCES public.subcontractors(id) ON DELETE CASCADE,
  response_type text NOT NULL CHECK (response_type IN ('accept', 'decline', 'timeout')),
  response_time timestamp with time zone NOT NULL DEFAULT now(),
  decline_reason text,
  estimated_arrival_minutes integer,
  notes text,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Job tracking for real-time status updates
CREATE TABLE public.job_tracking (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id uuid NOT NULL REFERENCES public.subcontractor_job_assignments(id) ON DELETE CASCADE,
  subcontractor_id uuid NOT NULL REFERENCES public.subcontractors(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'accepted', 'declined', 'en_route', 'arrived', 'started', 'paused', 'completed', 'cancelled')),
  check_in_time timestamp with time zone,
  check_out_time timestamp with time zone,
  check_in_location text,
  check_out_location text,
  gps_coordinates point,
  photos jsonb DEFAULT '[]'::jsonb,
  notes text,
  estimated_duration_minutes integer,
  actual_duration_minutes integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Communication logs for tracking all notifications
CREATE TABLE public.communication_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id uuid NOT NULL REFERENCES public.subcontractors(id) ON DELETE CASCADE,
  communication_type text NOT NULL CHECK (communication_type IN ('email', 'sms', 'push', 'in_app')),
  template_id text,
  subject text,
  message_content text NOT NULL,
  delivery_status text NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  provider text, -- 'resend', 'twilio', 'ghl', etc.
  provider_message_id text,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  sent_at timestamp with time zone,
  delivered_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- SMS configuration and templates
CREATE TABLE public.sms_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_key text NOT NULL UNIQUE,
  template_name text NOT NULL,
  message_content text NOT NULL,
  variables text[] DEFAULT '{}', -- Array of variable names like {subcontractor_name}, {job_address}
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Order status updates for customer communication
CREATE TABLE public.order_status_updates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  subcontractor_id uuid REFERENCES public.subcontractors(id) ON DELETE SET NULL,
  status_message text NOT NULL,
  estimated_arrival_minutes integer,
  location_update text,
  photos jsonb DEFAULT '[]'::jsonb,
  is_customer_visible boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Subcontractor availability windows
CREATE TABLE public.subcontractor_availability (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subcontractor_id uuid NOT NULL REFERENCES public.subcontractors(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(subcontractor_id, day_of_week, start_time, end_time)
);

-- Add indexes for performance
CREATE INDEX idx_job_assignment_tokens_assignment ON public.job_assignment_tokens(assignment_id);
CREATE INDEX idx_job_assignment_tokens_token ON public.job_assignment_tokens(token);
CREATE INDEX idx_job_assignment_tokens_expires ON public.job_assignment_tokens(expires_at);

CREATE INDEX idx_subcontractor_responses_assignment ON public.subcontractor_responses(assignment_id);
CREATE INDEX idx_subcontractor_responses_subcontractor ON public.subcontractor_responses(subcontractor_id);
CREATE INDEX idx_subcontractor_responses_type_time ON public.subcontractor_responses(response_type, response_time);

CREATE INDEX idx_job_tracking_assignment ON public.job_tracking(assignment_id);
CREATE INDEX idx_job_tracking_subcontractor ON public.job_tracking(subcontractor_id);
CREATE INDEX idx_job_tracking_status ON public.job_tracking(status);
CREATE INDEX idx_job_tracking_updated ON public.job_tracking(updated_at);

CREATE INDEX idx_communication_logs_recipient ON public.communication_logs(recipient_id);
CREATE INDEX idx_communication_logs_type_status ON public.communication_logs(communication_type, delivery_status);
CREATE INDEX idx_communication_logs_created ON public.communication_logs(created_at);

CREATE INDEX idx_order_status_updates_order ON public.order_status_updates(order_id);
CREATE INDEX idx_order_status_updates_subcontractor ON public.order_status_updates(subcontractor_id);
CREATE INDEX idx_order_status_updates_visible ON public.order_status_updates(is_customer_visible, created_at);

CREATE INDEX idx_subcontractor_availability_contractor ON public.subcontractor_availability(subcontractor_id);
CREATE INDEX idx_subcontractor_availability_day ON public.subcontractor_availability(day_of_week, is_active);

-- Enable RLS on all tables
ALTER TABLE public.job_assignment_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcontractor_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcontractor_availability ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Job assignment tokens (secure by token, no user-based access needed)
CREATE POLICY "Tokens are accessed by token value only" ON public.job_assignment_tokens
  FOR ALL USING (true); -- Access controlled by token validation functions

-- Subcontractor responses (subcontractors can view their own)
CREATE POLICY "Subcontractors can view their own responses" ON public.subcontractor_responses
  FOR SELECT USING (subcontractor_id IN (
    SELECT id FROM public.subcontractors WHERE user_id = auth.uid()
  ));

CREATE POLICY "System can insert responses" ON public.subcontractor_responses
  FOR INSERT WITH CHECK (true);

-- Job tracking (subcontractors can manage their own jobs, admins see all)
CREATE POLICY "Subcontractors can manage their job tracking" ON public.job_tracking
  FOR ALL USING (
    subcontractor_id IN (
      SELECT id FROM public.subcontractors WHERE user_id = auth.uid()
    ) OR 
    public.has_role(auth.uid(), 'admin'::app_role)
  );

-- Communication logs (admins and system only)
CREATE POLICY "Admins can view communication logs" ON public.communication_logs
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can manage communication logs" ON public.communication_logs
  FOR INSERT WITH CHECK (true);

-- SMS templates (admins only)
CREATE POLICY "Admins can manage SMS templates" ON public.sms_templates
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Order status updates (customers can view their orders, subcontractors can update)
CREATE POLICY "Customers can view their order updates" ON public.order_status_updates
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    ) AND is_customer_visible = true
  );

CREATE POLICY "Subcontractors can create status updates" ON public.order_status_updates
  FOR INSERT WITH CHECK (
    subcontractor_id IN (
      SELECT id FROM public.subcontractors WHERE user_id = auth.uid()
    )
  );

-- Subcontractor availability (subcontractors manage their own)
CREATE POLICY "Subcontractors can manage their availability" ON public.subcontractor_availability
  FOR ALL USING (
    subcontractor_id IN (
      SELECT id FROM public.subcontractors WHERE user_id = auth.uid()
    )
  );

-- Insert default SMS templates
INSERT INTO public.sms_templates (template_key, template_name, message_content, variables) VALUES 
  ('job_assignment', 'New Job Assignment', 'Hi {subcontractor_name}! You have a new job assignment for {customer_name} at {service_address} on {service_date} at {service_time}. Please respond within 2 hours: {accept_link}', ARRAY['subcontractor_name', 'customer_name', 'service_address', 'service_date', 'service_time', 'accept_link']),
  ('job_reminder', 'Job Reminder', 'Reminder: You have a job today for {customer_name} at {service_address} at {service_time}. Please arrive on time and check in when you arrive.', ARRAY['customer_name', 'service_address', 'service_time']),
  ('urgent_job', 'URGENT Job Assignment', '🚨 URGENT: High priority job for {customer_name} at {service_address} needs immediate attention. Please respond ASAP: {accept_link}', ARRAY['customer_name', 'service_address', 'accept_link']),
  ('job_accepted_confirmation', 'Job Accepted Confirmation', 'Thank you for accepting the job for {customer_name}. Job details: {service_address} on {service_date} at {service_time}. Customer contact: {customer_phone}', ARRAY['customer_name', 'service_address', 'service_date', 'service_time', 'customer_phone']),
  ('customer_update', 'Cleaner Update', 'Update from your cleaner: {status_message}', ARRAY['status_message']);

-- Add triggers for updated_at columns
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_job_assignment_tokens_updated_at
  BEFORE UPDATE ON public.job_assignment_tokens
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_job_tracking_updated_at
  BEFORE UPDATE ON public.job_tracking
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_sms_templates_updated_at
  BEFORE UPDATE ON public.sms_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_subcontractor_availability_updated_at
  BEFORE UPDATE ON public.subcontractor_availability
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();