-- Create notification_queue table for SMS notifications
CREATE TABLE IF NOT EXISTS public.notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_method TEXT NOT NULL CHECK (delivery_method IN ('sms', 'email', 'push', 'in_app')),
  recipient_phone TEXT,
  message TEXT NOT NULL,
  template_id TEXT,
  variables JSONB DEFAULT '{}'::jsonb,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  provider_used TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notification_analytics table for tracking
CREATE TABLE IF NOT EXISTS public.notification_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES public.notification_queue(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  delivery_method TEXT NOT NULL,
  status TEXT NOT NULL,
  provider TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification_queue
CREATE POLICY "Service role full access on notification_queue"
  ON public.notification_queue
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view notification_queue"
  ON public.notification_queue
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for notification_analytics
CREATE POLICY "Service role full access on notification_analytics"
  ON public.notification_analytics
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view notification_analytics"
  ON public.notification_analytics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON public.notification_queue(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notification_queue_customer ON public.notification_queue(customer_id);
CREATE INDEX IF NOT EXISTS idx_notification_analytics_customer ON public.notification_analytics(customer_id);