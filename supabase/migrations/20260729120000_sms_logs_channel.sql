-- Tag every outbound SMS with the booking rail that produced it.
--
-- The two rails now use different providers on purpose — the public
-- online booking interface is OpenPhone-only, while the internal (VA)
-- booking system fires its automated comms through GoHighLevel — so
-- "which provider sent this" is no longer enough to tell the rails
-- apart in reporting. `_shared/sms.ts` writes this column on every
-- attempt (sent, failed and suppressed) and the admin activity
-- dashboard splits its comms panel on it.
--
-- Nullable: rows written before this migration, plus lifecycle and
-- one-off operational sends that belong to neither booking funnel.

ALTER TABLE public.sms_logs
  ADD COLUMN IF NOT EXISTS channel text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sms_logs_channel_check'
  ) THEN
    ALTER TABLE public.sms_logs
      ADD CONSTRAINT sms_logs_channel_check
      CHECK (channel IS NULL OR channel IN ('internal', 'public'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS sms_logs_channel_created_idx
  ON public.sms_logs (channel, created_at DESC);

COMMENT ON COLUMN public.sms_logs.channel IS
  'Booking rail that produced the message: internal (VA booking, GHL-sent) or public (online booking interface, OpenPhone-sent). NULL for lifecycle/operational sends.';

-- Backfill the rails we can identify from the existing caller tags.
UPDATE public.sms_logs
   SET channel = 'internal'
 WHERE channel IS NULL
   AND context IN ('internal_booking_confirm', 'csr_booking');

UPDATE public.sms_logs
   SET channel = 'public'
 WHERE channel IS NULL
   AND context IN ('lead_intro', 'booking_confirm');
