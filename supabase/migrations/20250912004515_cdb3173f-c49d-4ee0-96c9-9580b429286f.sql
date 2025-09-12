-- Create the missing automated_notification_triggers table (minimal version)
CREATE TABLE IF NOT EXISTS public.automated_notification_triggers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trigger_name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  condition_data JSONB DEFAULT '{}',
  notification_template_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);