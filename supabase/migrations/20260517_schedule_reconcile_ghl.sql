-- ─── Schedule reconcile-ghl every 5 min ───────────────────────────────────
-- Companion to retry-ghl-syncs (which replays ghl_sync_log rows).
-- reconcile-ghl looks at the bookings table directly and re-fires
-- ghl-sync-booking for any row that's never-synced, errored, or stale.
-- Mirrors the same auth-header pattern as process-scheduled-emails /
-- retry-ghl-syncs so ops can manage all three jobs from cron.job.
--
-- Idempotent: drops the job first so re-running this migration on a
-- live DB updates the schedule cleanly.

SELECT cron.unschedule('reconcile-ghl-5min')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'reconcile-ghl-5min');

SELECT cron.schedule(
  'reconcile-ghl-5min',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://yltvknkqnzdeiqckqjha.supabase.co/functions/v1/reconcile-ghl',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsdHZrbmtxbnpkZWlxY2txamhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2OTk5MjAsImV4cCI6MjA3MzI3NTkyMH0.t1q4kcz8iu2I0UNStsU3Be4_vuqZ0LFQksdmwTpxIZ8'
    ),
    body := jsonb_build_object('limit', 10)
  ) AS request_id;
  $$
);
