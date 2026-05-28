-- pg_cron schedule for the balance-auth retry sweep.
--
-- Fires retry-balance-authorizations every 15 minutes. Authorization
-- uses the public anon JWT (the function gates inbound requests with
-- it but uses SUPABASE_SERVICE_ROLE_KEY internally for DB writes).
--
-- Requires extensions: pg_cron, pg_net (already enabled on this project).
--
-- To disable temporarily during ops work:
--   select cron.unschedule('balance-auth-sweep');

select cron.schedule(
  'balance-auth-sweep',
  '*/15 * * * *',
  $$
    select net.http_post(
      url := 'https://yltvknkqnzdeiqckqjha.functions.supabase.co/retry-balance-authorizations',
      headers := jsonb_build_object(
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsdHZrbmtxbnpkZWlxY2txamhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2OTk5MjAsImV4cCI6MjA3MzI3NTkyMH0.t1q4kcz8iu2I0UNStsU3Be4_vuqZ0LFQksdmwTpxIZ8',
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object('limit', 100)
    );
  $$
);
