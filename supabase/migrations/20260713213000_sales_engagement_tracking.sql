-- Sales & Engagement tracking support
-- 1) SMS delivery timestamps on notification_queue (populated by openphone-webhook)
-- 2) Deduplicate + enforce one hcp_sync_log row per booking so the
--    `onConflict: 'booking_id'` upsert in sync-booking-to-hcp works reliably
-- 3) Indexes that back the Sales & Engagement dashboard aggregations

-- 1) SMS delivery tracking columns ------------------------------------------
ALTER TABLE public.notification_queue
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- 2) hcp_sync_log: one row per booking --------------------------------------
-- Remove duplicate rows (keep the most recently updated) before adding the
-- unique index. Uses a window function so only the newest row per booking_id
-- survives.
DELETE FROM public.hcp_sync_log t
WHERE t.id IN (
  SELECT id FROM (
    SELECT id,
           row_number() OVER (
             PARTITION BY booking_id
             ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
           ) AS rn
    FROM public.hcp_sync_log
  ) ranked
  WHERE ranked.rn > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS hcp_sync_log_booking_id_key
  ON public.hcp_sync_log (booking_id);

-- 3) Dashboard-supporting indexes -------------------------------------------
CREATE INDEX IF NOT EXISTS email_events_recipient_idx
  ON public.email_events (recipient);
CREATE INDEX IF NOT EXISTS email_events_event_created_idx
  ON public.email_events (event, created_at DESC);

CREATE INDEX IF NOT EXISTS notification_analytics_method_status_idx
  ON public.notification_analytics (delivery_method, status);
CREATE INDEX IF NOT EXISTS notification_analytics_customer_idx
  ON public.notification_analytics (customer_id);

CREATE INDEX IF NOT EXISTS hcp_sync_log_status_idx
  ON public.hcp_sync_log (status);
