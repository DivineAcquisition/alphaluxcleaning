-- Set up monthly performance summary cron job
select
cron.schedule(
  'monthly-performance-summary',
  '0 9 1 * *', -- 9 AM on the 1st of every month
  $$
  select
    net.http_post(
        url:='https://kqoezqzogleaaupjzxch.supabase.co/functions/v1/send-monthly-performance-summary',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtxb2V6cXpvZ2xlYWF1cGp6eGNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzM5MDgwNCwiZXhwIjoyMDY4OTY2ODA0fQ.mGT_yQjUIllVtFvzj7KqJozJzxKUe7M_GfABSBVtV1s"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);