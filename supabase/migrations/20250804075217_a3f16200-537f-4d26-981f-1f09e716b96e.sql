-- Create webhook events table for audit trail
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}',
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source TEXT DEFAULT 'unknown',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create recurring tip schedules table
CREATE TABLE IF NOT EXISTS public.recurring_tip_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  customer_message TEXT,
  tip_type TEXT DEFAULT 'recurring',
  distribution_method TEXT DEFAULT 'individual',
  frequency TEXT NOT NULL,
  next_tip_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tip analytics table
CREATE TABLE IF NOT EXISTS public.tip_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  month_year TEXT NOT NULL UNIQUE,
  total_tips NUMERIC DEFAULT 0,
  tip_count INTEGER DEFAULT 0,
  average_tip NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subcontractor notifications table
CREATE TABLE IF NOT EXISTS public.subcontractor_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subcontractor_id UUID REFERENCES public.subcontractors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'general',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add columns to order_tips table if they don't exist
ALTER TABLE public.order_tips 
ADD COLUMN IF NOT EXISTS tip_type TEXT DEFAULT 'one_time',
ADD COLUMN IF NOT EXISTS distribution_method TEXT DEFAULT 'individual';

-- Enable RLS on new tables
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_tip_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tip_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcontractor_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for webhook events (admin only)
CREATE POLICY "Admins can manage webhook events" 
ON public.webhook_events 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Create policies for recurring tip schedules
CREATE POLICY "Customers can view their tip schedules" 
ON public.recurring_tip_schedules 
FOR SELECT 
USING (
  order_id IN (
    SELECT id FROM public.orders 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "System can manage tip schedules" 
ON public.recurring_tip_schedules 
FOR ALL 
USING (true);

-- Create policies for tip analytics (admin only)
CREATE POLICY "Admins can view tip analytics" 
ON public.tip_analytics 
FOR SELECT 
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Create policies for subcontractor notifications
CREATE POLICY "Subcontractors can view their notifications" 
ON public.subcontractor_notifications 
FOR SELECT 
USING (
  subcontractor_id IN (
    SELECT id FROM public.subcontractors 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Subcontractors can update their notifications" 
ON public.subcontractor_notifications 
FOR UPDATE 
USING (
  subcontractor_id IN (
    SELECT id FROM public.subcontractors 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "System can create notifications" 
ON public.subcontractor_notifications 
FOR INSERT 
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_webhook_events_type ON public.webhook_events(event_type);
CREATE INDEX idx_webhook_events_processed_at ON public.webhook_events(processed_at);
CREATE INDEX idx_recurring_tips_next_date ON public.recurring_tip_schedules(next_tip_date);
CREATE INDEX idx_recurring_tips_active ON public.recurring_tip_schedules(is_active);
CREATE INDEX idx_subcontractor_notifications_read ON public.subcontractor_notifications(subcontractor_id, read);

-- Create triggers for updated_at columns
CREATE TRIGGER update_recurring_tip_schedules_updated_at
  BEFORE UPDATE ON public.recurring_tip_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tip_analytics_updated_at
  BEFORE UPDATE ON public.tip_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();