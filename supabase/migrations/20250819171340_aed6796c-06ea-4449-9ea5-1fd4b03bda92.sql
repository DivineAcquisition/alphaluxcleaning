-- Phase 5: Customer Notification/Communication System Database Schema

-- Customer notification preferences table
CREATE TABLE IF NOT EXISTS public.customer_notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  sms_enabled BOOLEAN NOT NULL DEFAULT false,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  
  -- Notification type preferences
  booking_confirmations BOOLEAN NOT NULL DEFAULT true,
  service_reminders BOOLEAN NOT NULL DEFAULT true,
  service_updates BOOLEAN NOT NULL DEFAULT true,
  payment_notifications BOOLEAN NOT NULL DEFAULT true,
  promotional_notifications BOOLEAN NOT NULL DEFAULT false,
  
  -- Timing preferences
  reminder_hours_before INTEGER NOT NULL DEFAULT 24,
  quiet_hours_start TIME DEFAULT '22:00:00',
  quiet_hours_end TIME DEFAULT '08:00:00',
  timezone TEXT DEFAULT 'America/Los_Angeles',
  
  -- Contact info
  phone_number TEXT,
  preferred_language TEXT DEFAULT 'en',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Notification queue for scheduled notifications
CREATE TABLE IF NOT EXISTS public.notification_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  notification_type TEXT NOT NULL,
  delivery_method TEXT NOT NULL, -- 'email', 'sms', 'push', 'in_app'
  
  -- Content
  subject TEXT,
  message TEXT NOT NULL,
  template_data JSONB DEFAULT '{}',
  
  -- Scheduling
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'sent', 'delivered', 'failed', 'cancelled'
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  
  -- Delivery tracking
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  
  -- Error handling
  error_message TEXT,
  
  -- Metadata
  order_id UUID,
  booking_id UUID,
  priority INTEGER DEFAULT 5, -- 1 (highest) to 10 (lowest)
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Customer notification history/inbox
CREATE TABLE IF NOT EXISTS public.customer_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  
  -- Content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  
  -- Status
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Actions
  action_url TEXT,
  action_label TEXT,
  
  -- Metadata
  order_id UUID,
  booking_id UUID,
  importance TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  
  -- Rich content
  image_url TEXT,
  rich_content JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Notification analytics
CREATE TABLE IF NOT EXISTS public.notification_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Tracking info
  notification_id UUID, -- References notification_queue or customer_notifications
  customer_id UUID NOT NULL,
  event_type TEXT NOT NULL, -- 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'
  delivery_method TEXT NOT NULL,
  
  -- Analytics data
  user_agent TEXT,
  ip_address INET,
  device_type TEXT,
  
  -- Performance metrics
  send_duration_ms INTEGER,
  delivery_duration_ms INTEGER,
  
  -- A/B testing
  variant TEXT,
  campaign_id TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Notification templates for reusable content
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Template info
  name TEXT NOT NULL,
  template_type TEXT NOT NULL, -- 'booking_confirmation', 'service_reminder', etc.
  delivery_method TEXT NOT NULL,
  
  -- Content
  subject_template TEXT,
  message_template TEXT NOT NULL,
  
  -- Personalization
  variables JSONB DEFAULT '[]', -- Available template variables
  default_values JSONB DEFAULT '{}',
  
  -- Settings
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- A/B testing
  is_variant BOOLEAN NOT NULL DEFAULT false,
  parent_template_id UUID,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.customer_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customer_notification_preferences
CREATE POLICY "Customers can view their own notification preferences"
ON public.customer_notification_preferences
FOR SELECT
USING (customer_id IN (
  SELECT auth.uid()
  UNION
  SELECT user_id FROM public.subcontractors WHERE user_id = auth.uid()
));

CREATE POLICY "Customers can update their own notification preferences"
ON public.customer_notification_preferences
FOR UPDATE
USING (customer_id IN (
  SELECT auth.uid()
  UNION
  SELECT user_id FROM public.subcontractors WHERE user_id = auth.uid()
))
WITH CHECK (customer_id IN (
  SELECT auth.uid()
  UNION
  SELECT user_id FROM public.subcontractors WHERE user_id = auth.uid()
));

CREATE POLICY "Customers can insert their own notification preferences"
ON public.customer_notification_preferences
FOR INSERT
WITH CHECK (customer_id IN (
  SELECT auth.uid()
  UNION
  SELECT user_id FROM public.subcontractors WHERE user_id = auth.uid()
));

CREATE POLICY "Admins can manage all notification preferences"
ON public.customer_notification_preferences
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for notification_queue
CREATE POLICY "System can manage notification queue"
ON public.notification_queue
FOR ALL
USING (true);

-- RLS Policies for customer_notifications
CREATE POLICY "Customers can view their own notifications"
ON public.customer_notifications
FOR SELECT
USING (customer_id IN (
  SELECT auth.uid()
  UNION
  SELECT user_id FROM public.subcontractors WHERE user_id = auth.uid()
));

CREATE POLICY "Customers can update their own notifications"
ON public.customer_notifications
FOR UPDATE
USING (customer_id IN (
  SELECT auth.uid()
  UNION
  SELECT user_id FROM public.subcontractors WHERE user_id = auth.uid()
))
WITH CHECK (customer_id IN (
  SELECT auth.uid()
  UNION
  SELECT user_id FROM public.subcontractors WHERE user_id = auth.uid()
));

CREATE POLICY "System can insert customer notifications"
ON public.customer_notifications
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can manage all customer notifications"
ON public.customer_notifications
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for notification_analytics
CREATE POLICY "Admins can view notification analytics"
ON public.notification_analytics
FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "System can insert notification analytics"
ON public.notification_analytics
FOR INSERT
WITH CHECK (true);

-- RLS Policies for notification_templates
CREATE POLICY "Authenticated users can view active templates"
ON public.notification_templates
FOR SELECT
USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "Admins can manage notification templates"
ON public.notification_templates
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_notification_preferences_customer_id 
ON public.customer_notification_preferences(customer_id);

CREATE INDEX IF NOT EXISTS idx_notification_queue_customer_id 
ON public.notification_queue(customer_id);

CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled_for 
ON public.notification_queue(scheduled_for);

CREATE INDEX IF NOT EXISTS idx_notification_queue_status 
ON public.notification_queue(status);

CREATE INDEX IF NOT EXISTS idx_customer_notifications_customer_id 
ON public.customer_notifications(customer_id);

CREATE INDEX IF NOT EXISTS idx_customer_notifications_read_status 
ON public.customer_notifications(customer_id, is_read);

CREATE INDEX IF NOT EXISTS idx_notification_analytics_customer_id 
ON public.notification_analytics(customer_id);

CREATE INDEX IF NOT EXISTS idx_notification_analytics_event_type 
ON public.notification_analytics(event_type, created_at);

CREATE INDEX IF NOT EXISTS idx_notification_templates_type_method 
ON public.notification_templates(template_type, delivery_method, is_active);

-- Functions for notification processing
CREATE OR REPLACE FUNCTION public.create_notification_safe(
  p_customer_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_notification_type TEXT,
  p_order_id UUID DEFAULT NULL,
  p_booking_id UUID DEFAULT NULL,
  p_importance TEXT DEFAULT 'normal',
  p_action_url TEXT DEFAULT NULL,
  p_action_label TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.customer_notifications (
    customer_id,
    title,
    message,
    notification_type,
    order_id,
    booking_id,
    importance,
    action_url,
    action_label
  ) VALUES (
    p_customer_id,
    p_title,
    p_message,
    p_notification_type,
    p_order_id,
    p_booking_id,
    p_importance,
    p_action_url,
    p_action_label
  ) RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$function$;

-- Function to queue notifications based on customer preferences
CREATE OR REPLACE FUNCTION public.queue_notification(
  p_customer_id UUID,
  p_notification_type TEXT,
  p_subject TEXT,
  p_message TEXT,
  p_scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT now(),
  p_template_data JSONB DEFAULT '{}',
  p_order_id UUID DEFAULT NULL,
  p_booking_id UUID DEFAULT NULL,
  p_priority INTEGER DEFAULT 5
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_preferences RECORD;
  v_notification_ids UUID[] := '{}';
  v_notification_id UUID;
BEGIN
  -- Get customer preferences
  SELECT * INTO v_preferences
  FROM public.customer_notification_preferences
  WHERE customer_id = p_customer_id;
  
  -- If no preferences found, create default ones
  IF NOT FOUND THEN
    INSERT INTO public.customer_notification_preferences (customer_id)
    VALUES (p_customer_id);
    
    SELECT * INTO v_preferences
    FROM public.customer_notification_preferences
    WHERE customer_id = p_customer_id;
  END IF;
  
  -- Queue email notification if enabled
  IF v_preferences.email_enabled AND 
     CASE p_notification_type
       WHEN 'booking_confirmation' THEN v_preferences.booking_confirmations
       WHEN 'service_reminder' THEN v_preferences.service_reminders
       WHEN 'service_update' THEN v_preferences.service_updates
       WHEN 'payment_notification' THEN v_preferences.payment_notifications
       WHEN 'promotional' THEN v_preferences.promotional_notifications
       ELSE true
     END THEN
    
    INSERT INTO public.notification_queue (
      customer_id, notification_type, delivery_method, subject, message,
      scheduled_for, template_data, order_id, booking_id, priority
    ) VALUES (
      p_customer_id, p_notification_type, 'email', p_subject, p_message,
      p_scheduled_for, p_template_data, p_order_id, p_booking_id, p_priority
    ) RETURNING id INTO v_notification_id;
    
    v_notification_ids := array_append(v_notification_ids, v_notification_id);
  END IF;
  
  -- Queue SMS notification if enabled and phone number exists
  IF v_preferences.sms_enabled AND v_preferences.phone_number IS NOT NULL AND
     CASE p_notification_type
       WHEN 'booking_confirmation' THEN v_preferences.booking_confirmations
       WHEN 'service_reminder' THEN v_preferences.service_reminders
       WHEN 'service_update' THEN v_preferences.service_updates
       WHEN 'payment_notification' THEN v_preferences.payment_notifications
       ELSE false -- No promotional SMS by default
     END THEN
    
    INSERT INTO public.notification_queue (
      customer_id, notification_type, delivery_method, subject, message,
      scheduled_for, template_data, order_id, booking_id, priority
    ) VALUES (
      p_customer_id, p_notification_type, 'sms', p_subject, p_message,
      p_scheduled_for, p_template_data, p_order_id, p_booking_id, p_priority
    ) RETURNING id INTO v_notification_id;
    
    v_notification_ids := array_append(v_notification_ids, v_notification_id);
  END IF;
  
  -- Always create in-app notification
  INSERT INTO public.notification_queue (
    customer_id, notification_type, delivery_method, subject, message,
    scheduled_for, template_data, order_id, booking_id, priority
  ) VALUES (
    p_customer_id, p_notification_type, 'in_app', p_subject, p_message,
    p_scheduled_for, p_template_data, p_order_id, p_booking_id, p_priority
  ) RETURNING id INTO v_notification_id;
  
  v_notification_ids := array_append(v_notification_ids, v_notification_id);
  
  RETURN jsonb_build_object(
    'success', true,
    'notification_ids', to_jsonb(v_notification_ids),
    'message', 'Notifications queued successfully'
  );
END;
$function$;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(
  p_notification_id UUID,
  p_customer_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.customer_notifications
  SET is_read = true, read_at = now(), updated_at = now()
  WHERE id = p_notification_id AND customer_id = p_customer_id;
  
  -- Track analytics
  INSERT INTO public.notification_analytics (
    notification_id, customer_id, event_type, delivery_method
  ) VALUES (
    p_notification_id, p_customer_id, 'opened', 'in_app'
  );
  
  RETURN FOUND;
END;
$function$;

-- Insert default notification templates
INSERT INTO public.notification_templates (name, template_type, delivery_method, subject_template, message_template, variables) VALUES
('Booking Confirmation Email', 'booking_confirmation', 'email', 
 'Booking Confirmed - {{service_type}} on {{service_date}}',
 'Hello {{customer_name}},\n\nYour {{service_type}} service has been confirmed for {{service_date}} at {{service_time}}.\n\nService Details:\n- Address: {{service_address}}\n- Estimated Duration: {{duration}} hours\n- Total Cost: ${{total_amount}}\n\nWe''ll send you a reminder 24 hours before your service.\n\nThank you for choosing Bay Area Cleaning Professionals!',
 '["customer_name", "service_type", "service_date", "service_time", "service_address", "duration", "total_amount"]'),

('Service Reminder SMS', 'service_reminder', 'sms',
 'Service Reminder',
 'Hi {{customer_name}}! Your {{service_type}} is scheduled for tomorrow at {{service_time}}. Address: {{service_address}}. Questions? Reply STOP to opt out.',
 '["customer_name", "service_type", "service_time", "service_address"]'),

('Payment Confirmation', 'payment_confirmation', 'email',
 'Payment Confirmation - ${{amount}}',
 'Hello {{customer_name}},\n\nYour payment of ${{amount}} has been successfully processed.\n\nPayment Details:\n- Service: {{service_type}}\n- Date: {{service_date}}\n- Payment Method: {{payment_method}}\n- Transaction ID: {{transaction_id}}\n\nThank you for your business!',
 '["customer_name", "amount", "service_type", "service_date", "payment_method", "transaction_id"]'),

('Service Update', 'service_update', 'in_app',
 'Service Update',
 'Your {{service_type}} service has been updated. {{update_message}}',
 '["service_type", "update_message"]')

ON CONFLICT (name, template_type, delivery_method) DO NOTHING;