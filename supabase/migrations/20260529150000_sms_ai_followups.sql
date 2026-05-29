-- Follow-up cadence for the AI SMS agent.
--
-- Adds scheduling columns to sms_ai_conversations and a pg_cron sweep that
-- pings the agent's run_followups action every 5 minutes. A lead who goes
-- quiet gets a fresh, contextual nudge at 30m → 4h → 1d → 3d → 7d → 14d,
-- then the cadence stops. It resets the moment the lead replies and never
-- runs for booked / opted-out / lost threads or after a STOP.

alter table public.sms_ai_conversations
  add column if not exists followups_sent integer not null default 0,
  add column if not exists last_followup_at timestamptz,
  add column if not exists next_followup_at timestamptz;

-- Partial index keeps the every-5-min sweep query cheap.
create index if not exists sms_ai_conversations_followup_idx
  on public.sms_ai_conversations (next_followup_at)
  where next_followup_at is not null;

-- Schedule (idempotent): drop any prior job of the same name first.
do $$
begin
  perform cron.unschedule('sms-ai-followups');
exception when others then
  null;
end $$;

select cron.schedule(
  'sms-ai-followups',
  '*/5 * * * *',
  $$
    select net.http_post(
      url := 'https://yltvknkqnzdeiqckqjha.functions.supabase.co/ghl-sms-ai-agent',
      headers := jsonb_build_object(
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsdHZrbmtxbnpkZWlxY2txamhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2OTk5MjAsImV4cCI6MjA3MzI3NTkyMH0.t1q4kcz8iu2I0UNStsU3Be4_vuqZ0LFQksdmwTpxIZ8',
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object('action', 'run_followups', 'limit', 50)
    );
  $$
);
