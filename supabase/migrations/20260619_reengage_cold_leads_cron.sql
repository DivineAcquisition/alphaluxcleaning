-- pg_cron schedule for the cold-lead re-engagement sweep.
--
-- Fires reengage-cold-leads once a day (16:00 UTC ≈ 11am ET / 8am PT).
-- The function finds GHL contacts with no activity for 30+ days and
-- sends a win-back SMS (GHL-first, OpenPhone fallback), tagging each so
-- it's only messaged once per cooldown cycle.
--
-- Requires extensions: pg_cron, pg_net (already enabled on this project).
--
-- To disable temporarily during ops work:
--   select cron.unschedule('reengage-cold-leads-daily');

select cron.schedule(
  'reengage-cold-leads-daily',
  '0 16 * * *',
  $$
    select net.http_post(
      url := 'https://yltvknkqnzdeiqckqjha.functions.supabase.co/reengage-cold-leads',
      headers := jsonb_build_object(
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsdHZrbmtxbnpkZWlxY2txamhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2OTk5MjAsImV4cCI6MjA3MzI3NTkyMH0.t1q4kcz8iu2I0UNStsU3Be4_vuqZ0LFQksdmwTpxIZ8',
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object('days', 30, 'limit', 50)
    );
  $$
);
