-- Recreate the lifecycle-engine sweep. The original job from
-- 20260723100000 used the old functions.supabase.co host and is no
-- longer in cron.job. Use the same functions/v1 URL as the live
-- process-scheduled-sms cron so pg_net actually reaches the function.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'lifecycle-engine-run') THEN
    PERFORM cron.unschedule('lifecycle-engine-run');
  END IF;
END $$;

SELECT cron.schedule(
  'lifecycle-engine-run',
  '*/20 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://yltvknkqnzdeiqckqjha.supabase.co/functions/v1/lifecycle-engine',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsdHZrbmtxbnpkZWlxY2txamhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2OTk5MjAsImV4cCI6MjA3MzI3NTkyMH0.t1q4kcz8iu2I0UNStsU3Be4_vuqZ0LFQksdmwTpxIZ8'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
