-- Enable RLS on the automated_notification_triggers table
ALTER TABLE public.automated_notification_triggers ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for system access only
CREATE POLICY "System can manage notification triggers" 
ON public.automated_notification_triggers 
FOR ALL 
USING (false) 
WITH CHECK (false);