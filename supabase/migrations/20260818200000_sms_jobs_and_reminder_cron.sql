-- SMS reminder jobs, mirroring email_jobs so 24h / 2h booking reminders
-- can go out by text as well as email. process-scheduled-sms claims due
-- rows every 5 minutes (same cadence as process-scheduled-emails).

CREATE TABLE IF NOT EXISTS public.sms_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_phone text NOT NULL,
  template_name text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'scheduled',
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  event_id text,
  booking_id uuid,
  trigger_kind text,
  scheduled_for timestamptz,
  sent_at timestamptz,
  provider_message_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS sms_jobs_booking_trigger_unique
  ON public.sms_jobs (booking_id, trigger_kind);

CREATE INDEX IF NOT EXISTS sms_jobs_due_idx
  ON public.sms_jobs (scheduled_for)
  WHERE status IN ('queued', 'scheduled');

CREATE INDEX IF NOT EXISTS sms_jobs_status_idx
  ON public.sms_jobs (status);

ALTER TABLE public.sms_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage sms jobs" ON public.sms_jobs;
CREATE POLICY "Admins can manage sms jobs"
  ON public.sms_jobs
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- pg_cron sweep. Anon JWT is a valid JWT, so the function can keep
-- verify_jwt = true (same pattern as process-scheduled-emails).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-scheduled-sms-5min') THEN
    PERFORM cron.unschedule('process-scheduled-sms-5min');
  END IF;
END $$;

SELECT cron.schedule(
  'process-scheduled-sms-5min',
  '*/5 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://yltvknkqnzdeiqckqjha.supabase.co/functions/v1/process-scheduled-sms',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsdHZrbmtxbnpkZWlxY2txamhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2OTk5MjAsImV4cCI6MjA3MzI3NTkyMH0.t1q4kcz8iu2I0UNStsU3Be4_vuqZ0LFQksdmwTpxIZ8'
      ),
      body := jsonb_build_object('limit', 50)
    ) AS request_id;
  $$
);
