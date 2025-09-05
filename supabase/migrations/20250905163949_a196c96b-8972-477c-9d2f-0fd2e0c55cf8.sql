-- Create subcontractor availability management table
CREATE TABLE IF NOT EXISTS public.subcontractor_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subcontractor_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL, -- 0-6 (Sunday-Saturday)
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_availability_subcontractor 
    FOREIGN KEY (subcontractor_id) REFERENCES subcontractors(id) ON DELETE CASCADE
);

-- Create subcontractor blackout periods table
CREATE TABLE IF NOT EXISTS public.subcontractor_blackouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subcontractor_id UUID NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_blackout_subcontractor 
    FOREIGN KEY (subcontractor_id) REFERENCES subcontractors(id) ON DELETE CASCADE
);

-- Create enhanced communication logs table
CREATE TABLE IF NOT EXISTS public.communication_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID,
  subcontractor_id UUID,
  communication_type TEXT NOT NULL, -- 'sms', 'email', 'in_app', 'push'
  direction TEXT NOT NULL, -- 'outbound', 'inbound'
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent', -- 'sent', 'delivered', 'read', 'failed'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_comm_booking 
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  CONSTRAINT fk_comm_subcontractor 
    FOREIGN KEY (subcontractor_id) REFERENCES subcontractors(id) ON DELETE CASCADE
);

-- Create job assignment analytics table
CREATE TABLE IF NOT EXISTS public.assignment_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL,
  subcontractor_id UUID,
  assignment_sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  response_received_at TIMESTAMP WITH TIME ZONE,
  response_type TEXT, -- 'accepted', 'declined', 'expired'
  response_time_minutes INTEGER,
  decline_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_analytics_booking 
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  CONSTRAINT fk_analytics_subcontractor 
    FOREIGN KEY (subcontractor_id) REFERENCES subcontractors(id) ON DELETE SET NULL
);

-- Create assignment queue table for backup assignments
CREATE TABLE IF NOT EXISTS public.assignment_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL,
  subcontractor_id UUID NOT NULL,
  priority_order INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'assigned', 'skipped', 'expired'
  assigned_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_queue_booking 
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  CONSTRAINT fk_queue_subcontractor 
    FOREIGN KEY (subcontractor_id) REFERENCES subcontractors(id) ON DELETE CASCADE
);

-- Enable RLS on new tables
ALTER TABLE public.subcontractor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcontractor_blackouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subcontractor_availability
CREATE POLICY "Subcontractors can manage their own availability"
ON public.subcontractor_availability
FOR ALL
USING (subcontractor_id IN (
  SELECT id FROM subcontractors WHERE user_id = auth.uid()
))
WITH CHECK (subcontractor_id IN (
  SELECT id FROM subcontractors WHERE user_id = auth.uid()
));

CREATE POLICY "Admins can view all availability"
ON public.subcontractor_availability
FOR SELECT
USING (public.enhanced_admin_verification());

-- RLS Policies for subcontractor_blackouts
CREATE POLICY "Subcontractors can manage their own blackouts"
ON public.subcontractor_blackouts
FOR ALL
USING (subcontractor_id IN (
  SELECT id FROM subcontractors WHERE user_id = auth.uid()
))
WITH CHECK (subcontractor_id IN (
  SELECT id FROM subcontractors WHERE user_id = auth.uid()
));

-- RLS Policies for communication_logs
CREATE POLICY "Subcontractors can view their own communications"
ON public.communication_logs
FOR SELECT
USING (subcontractor_id IN (
  SELECT id FROM subcontractors WHERE user_id = auth.uid()
));

CREATE POLICY "System can insert communication logs"
ON public.communication_logs
FOR INSERT
WITH CHECK (true);

-- RLS Policies for assignment_analytics
CREATE POLICY "System can manage assignment analytics"
ON public.assignment_analytics
FOR ALL
USING (true);

-- RLS Policies for assignment_queue
CREATE POLICY "System can manage assignment queue"
ON public.assignment_queue
FOR ALL
USING (true);

-- Create indexes for performance
CREATE INDEX idx_availability_subcontractor ON public.subcontractor_availability(subcontractor_id);
CREATE INDEX idx_availability_day ON public.subcontractor_availability(day_of_week);
CREATE INDEX idx_blackouts_subcontractor ON public.subcontractor_blackouts(subcontractor_id);
CREATE INDEX idx_blackouts_dates ON public.subcontractor_blackouts(start_date, end_date);
CREATE INDEX idx_comm_logs_booking ON public.communication_logs(booking_id);
CREATE INDEX idx_comm_logs_subcontractor ON public.communication_logs(subcontractor_id);
CREATE INDEX idx_analytics_booking ON public.assignment_analytics(booking_id);
CREATE INDEX idx_analytics_subcontractor ON public.assignment_analytics(subcontractor_id);
CREATE INDEX idx_queue_booking ON public.assignment_queue(booking_id);
CREATE INDEX idx_queue_priority ON public.assignment_queue(booking_id, priority_order);

-- Create function to get subcontractor availability
CREATE OR REPLACE FUNCTION public.get_subcontractor_availability(p_subcontractor_id UUID, p_date DATE)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_day_of_week INTEGER;
  v_availability JSONB;
  v_blackout_exists BOOLEAN := false;
BEGIN
  -- Get day of week (0 = Sunday, 1 = Monday, etc.)
  v_day_of_week := EXTRACT(dow FROM p_date);
  
  -- Check for blackout periods
  SELECT EXISTS(
    SELECT 1 FROM public.subcontractor_blackouts
    WHERE subcontractor_id = p_subcontractor_id
    AND p_date BETWEEN start_date AND end_date
  ) INTO v_blackout_exists;
  
  IF v_blackout_exists THEN
    RETURN jsonb_build_object(
      'available', false,
      'reason', 'blackout_period',
      'slots', '[]'::jsonb
    );
  END IF;
  
  -- Get regular availability for the day
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'start_time', start_time,
        'end_time', end_time,
        'is_available', is_available
      )
    ), '[]'::jsonb
  ) INTO v_availability
  FROM public.subcontractor_availability
  WHERE subcontractor_id = p_subcontractor_id
  AND day_of_week = v_day_of_week
  AND is_available = true;
  
  RETURN jsonb_build_object(
    'available', true,
    'slots', v_availability
  );
END;
$$;