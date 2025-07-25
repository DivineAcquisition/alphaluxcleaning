-- Create notifications table for subcontractors
CREATE TABLE public.subcontractor_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcontractor_id UUID REFERENCES public.subcontractors(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'welcome')),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subcontractor_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Subcontractors can view their own notifications" ON public.subcontractor_notifications
FOR SELECT USING (
  user_id = auth.uid() OR 
  subcontractor_id IN (
    SELECT id FROM public.subcontractors WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Subcontractors can update their own notifications" ON public.subcontractor_notifications
FOR UPDATE USING (
  user_id = auth.uid() OR 
  subcontractor_id IN (
    SELECT id FROM public.subcontractors WHERE user_id = auth.uid()
  )
);

CREATE POLICY "System can manage notifications" ON public.subcontractor_notifications
FOR ALL USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_subcontractor_notifications_updated_at
BEFORE UPDATE ON public.subcontractor_notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();