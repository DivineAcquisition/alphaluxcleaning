-- Phase 5: Customer Notification/Communication System Database Schema - Fixed

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Admins can manage notification templates" ON public.notification_templates;

-- Customer notification preferences table
CREATE TABLE IF NOT EXISTS public.customer_notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL UNIQUE,
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

-- Enable Row Level Security
ALTER TABLE public.customer_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customer_notification_preferences
CREATE POLICY "Customers can view their own notification preferences"
ON public.customer_notification_preferences
FOR SELECT
USING (customer_id = auth.uid());

CREATE POLICY "Customers can update their own notification preferences"
ON public.customer_notification_preferences
FOR UPDATE
USING (customer_id = auth.uid())
WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers can insert their own notification preferences"
ON public.customer_notification_preferences
FOR INSERT
WITH CHECK (customer_id = auth.uid());

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
USING (customer_id = auth.uid());

CREATE POLICY "Customers can update their own notifications"
ON public.customer_notifications
FOR UPDATE
USING (customer_id = auth.uid())
WITH CHECK (customer_id = auth.uid());

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