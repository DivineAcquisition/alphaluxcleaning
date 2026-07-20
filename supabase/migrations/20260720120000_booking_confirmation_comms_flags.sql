-- Idempotency flags for the booking confirmation fan-out.
--
-- `booking-confirm-comms` claims these columns atomically
-- (UPDATE ... WHERE ... IS NULL) before sending, so a retried
-- webhook, a double-submitted details form, or concurrent invokes
-- can never double-send the customer confirmation email or SMS.

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS confirmation_email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirmation_sms_sent_at timestamptz;

COMMENT ON COLUMN public.bookings.confirmation_email_sent_at IS
  'Set when the customer booking-confirmation email was dispatched (claimed atomically by booking-confirm-comms).';
COMMENT ON COLUMN public.bookings.confirmation_sms_sent_at IS
  'Set when the customer booking-confirmation SMS was dispatched (claimed atomically by booking-confirm-comms).';

-- Backfill: bookings confirmed before this migration already received
-- their (legacy, non-idempotent) confirmation sends. Stamp them so
-- any retro re-invoke of the confirm path can't message old customers.
UPDATE public.bookings
SET
  confirmation_email_sent_at = COALESCE(paid_at, updated_at, now()),
  confirmation_sms_sent_at   = COALESCE(paid_at, updated_at, now())
WHERE status = 'confirmed'
  AND confirmation_email_sent_at IS NULL;
