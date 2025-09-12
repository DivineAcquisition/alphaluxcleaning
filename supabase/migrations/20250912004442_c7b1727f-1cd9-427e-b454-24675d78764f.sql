-- Create the missing automated_notification_triggers table
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

-- Enable Row Level Security
ALTER TABLE public.automated_notification_triggers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies using the correct admin role
CREATE POLICY "Admins can manage notification triggers" 
ON public.automated_notification_triggers 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Add updated_at trigger
CREATE TRIGGER update_automated_notification_triggers_updated_at
BEFORE UPDATE ON public.automated_notification_triggers
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();