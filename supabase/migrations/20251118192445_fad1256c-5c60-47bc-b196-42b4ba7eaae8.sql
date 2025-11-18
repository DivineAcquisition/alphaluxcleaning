-- Create test runs tracking table
CREATE TABLE IF NOT EXISTS public.test_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scenario_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('running', 'passed', 'failed', 'cancelled')),
  duration_ms INTEGER,
  results JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  test_type TEXT DEFAULT 'manual' -- 'manual', 'automated', 'load'
);

-- Create booking events tracking table
CREATE TABLE IF NOT EXISTS public.booking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'step_started', 'step_completed', 'error', 'payment_attempt'
  event_data JSONB DEFAULT '{}'::jsonb,
  session_id TEXT,
  step_name TEXT, -- 'zip', 'sqft', 'offer', 'checkout', 'details', 'confirmation'
  error_message TEXT
);

-- Enable Row Level Security
ALTER TABLE public.test_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_events ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can manage test runs"
ON public.test_runs
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can view booking events"
ON public.booking_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Service role can manage booking events"
ON public.booking_events
FOR ALL
USING (auth.role() = 'service_role');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_test_runs_created_at ON public.test_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_test_runs_status ON public.test_runs(status);
CREATE INDEX IF NOT EXISTS idx_booking_events_booking_id ON public.booking_events(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_events_created_at ON public.booking_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_booking_events_session_id ON public.booking_events(session_id);

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.test_runs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.booking_events;